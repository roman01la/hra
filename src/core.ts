import { ptr } from "bun:ffi";
import { mat4, vec3 } from "gl-matrix";
import * as gl from "./ffi";
import { Shader } from "./shader";
import { Camera } from "./camera";
import { loadSceneGraph } from "./assimp";
import { GBuffer } from "./gbuffer";
import { ShadowMap } from "./shadowmap";
import { createWindow } from "./window";

const kWidth = 800;
const kHeight = 600;

const window = createWindow(kWidth, kHeight, "Hra");

const GL_COLOR_BUFFER_BIT = 0x00004000;
const GL_DEPTH_BUFFER_BIT = 0x00000100;
const GL_DEPTH_TEST = 0x0b71;
const GL_LESS = 0x0201;
const GL_CULL_FACE = 0x0b44;
const GL_BACK = 0x0405;
const GL_FRONT = 0x0404;
const GL_CCW = 0x0901;
const GL_POLYGON_OFFSET_FILL = 0x8037;
const GL_ARRAY_BUFFER = 0x8892;
const GL_STATIC_DRAW = 0x88e4;
const GL_FLOAT = 0x1406;
const GL_TEXTURE_2D = 0x0de1;
const GL_FRAMEBUFFER = 0x8d40;
const GL_TRIANGLES = 0x0004;
const GL_TEXTURE0 = 0x84c0;
const GL_TEXTURE1 = 0x84c1;

// Allocate 4-byte buffers for width and height (int32)
const fbWidthBuf = new Int32Array(1);
const fbHeightBuf = new Int32Array(1);

// ---- Shader setup (Blinn–Phong) ----

const vertexSrc = await Bun.file("resources/shaders/bp.vert").text();
const fragmentSrc = await Bun.file("resources/shaders/bp.frag").text();

const shader = new Shader(vertexSrc, fragmentSrc);
const uProjection = shader.uniform("uProjection");
const uModelView = shader.uniform("uModelView");
const uLightVP = shader.uniform("uLightVP");
const uModel = shader.uniform("uModel");
const uLightDir = shader.uniform("uLightDir");
const uViewPos = shader.uniform("uViewPos");
const uShininess = shader.uniform("uShininess");
const uShadowMap = shader.uniform("uShadowMap");
const uShadowTexelSize = shader.uniform("uShadowTexelSize");
const uAmbientStrength = shader.uniform("uAmbientStrength");
const uSpecularStrength = shader.uniform("uSpecularStrength");
const uSkyColor = shader.uniform("uSkyColor");
const uGroundColor = shader.uniform("uGroundColor");
const uLightSizeUV = shader.uniform("uLightSizeUV");
const uPenumbraScale = shader.uniform("uPenumbraScale");
const uMaxShadowLighten = shader.uniform("uMaxShadowLighten");

const graph = await loadSceneGraph("castle.glb", shader);
const root = graph[0];

const cloud1 = root.findByName("cloud_1")!;
const cloud2 = root.findByName("cloud_2")!;

const c1NoT = mat4.clone(cloud1.local);
const c2NoT = mat4.clone(cloud2.local);

c1NoT[12] = 0;
c1NoT[13] = 0;
c1NoT[14] = 0;

c2NoT[12] = 0;
c2NoT[13] = 0;
c2NoT[14] = 0;

const c1Y = cloud1.local[13];
const c2Y = cloud2.local[13];
const c1Radius = Math.hypot(cloud1.local[12], cloud1.local[14]);
const c2Radius = Math.hypot(cloud2.local[12], cloud2.local[14]);
let cloud1Angle = Math.atan2(cloud1.local[14], cloud1.local[12]);
let cloud2Angle =
  Math.atan2(cloud2.local[14], cloud2.local[12]) + Math.PI * 0.5; // offset

const center = vec3.fromValues(0, 0, 0);
const camera = new Camera(center, 10);
const gbuffer = new GBuffer(kWidth, kHeight);
const shadow = new ShadowMap(4096);
// Animate the directional light around the scene center
let lightAngle = 0.0; // radians

// Shadow shader
const shadowVert = await Bun.file("resources/shaders/shadow.vert").text();
const shadowFrag = await Bun.file("resources/shaders/shadow.frag").text();
const shadowShader = new Shader(shadowVert, shadowFrag);
const uShadowLightVP = shadowShader.uniform("uLightVP");
const uShadowModel = shadowShader.uniform("uModel");

// Post shader (fullscreen quad)
const postVert = await Bun.file("resources/shaders/comp.vert").text();
const postFrag = await Bun.file("resources/shaders/comp.frag").text();
const postShader = new Shader(postVert, postFrag);
const uTex = postShader.uniform("uTex");
const aQuadPos = postShader.attrib("aPosition");
const aQuadUV = postShader.attrib("aUV");
const quadVBO = new Uint32Array(1);
const quadTBO = new Uint32Array(1);

const quadVerts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
const quadUVs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1]);
gl.glGenBuffers(1, quadVBO);
gl.glBindBuffer(GL_ARRAY_BUFFER, quadVBO[0]);
gl.glBufferData(
  GL_ARRAY_BUFFER,
  quadVerts.byteLength,
  ptr(quadVerts),
  GL_STATIC_DRAW
);
gl.glGenBuffers(1, quadTBO);
gl.glBindBuffer(GL_ARRAY_BUFFER, quadTBO[0]);
gl.glBufferData(
  GL_ARRAY_BUFFER,
  quadUVs.byteLength,
  ptr(quadUVs),
  GL_STATIC_DRAW
);

class Clock {
  dt = 0;
  time = 0;

  tick() {
    const cTime = gl.glfwGetTime() * 1e3;
    this.dt = cTime - this.time;
    this.time = cTime;
    return this.dt;
  }
}

// ---- Render loop ----

const lightEye = vec3.create();
const lightView = mat4.create();
const lightProj = mat4.create();
const lightVP = mat4.create();
const sunDir = vec3.create();
const mv = mat4.create();
const skyColor = vec3.fromValues(0.6, 0.7, 0.9);
const groundColor = vec3.fromValues(0.3, 0.28, 0.25);

const clock = new Clock();

while (!gl.glfwWindowShouldClose(window)) {
  clock.tick();

  // Query actual framebuffer size and resize GBuffer if needed
  // Query actual framebuffer size
  gl.glfwGetFramebufferSize(window, fbWidthBuf, fbHeightBuf);
  const fbW = fbWidthBuf[0] || kWidth;
  const fbH = fbHeightBuf[0] || kHeight;
  gl.glViewport(0, 0, fbW, fbH);
  gbuffer.resize(fbW, fbH);

  // Build a perspective matrix
  camera.setAspect(fbW, fbH);
  const persp = camera.projection();

  // Enable depth test
  gl.glEnable(GL_DEPTH_TEST);
  gl.glDepthFunc(GL_LESS);
  // Enable backface culling for main pass
  gl.glEnable(GL_CULL_FACE);
  gl.glFrontFace(GL_CCW);
  gl.glCullFace(GL_BACK);

  // Camera/view transform
  camera.angle += 0.004 / clock.dt;
  const view = camera.view();
  const eye = camera.eye();

  // Animate cloud nodes

  cloud1Angle += 0.01 / clock.dt;
  const x1 = Math.cos(cloud1Angle) * (c1Radius || 8.0);
  const z1 = Math.sin(cloud1Angle) * (c1Radius || 8.0);
  const T1 = mat4.fromTranslation(mat4.create(), [x1, c1Y, z1]);
  mat4.multiply(cloud1.local, T1, c1NoT);
  cloud1.updateWorld();

  cloud2Angle += 0.009 / clock.dt;
  const x2 = Math.cos(cloud2Angle) * (c2Radius || 10.0);
  const z2 = Math.sin(cloud2Angle) * (c2Radius || 10.0);
  const T2 = mat4.fromTranslation(mat4.create(), [x2, c2Y, z2]);
  mat4.multiply(cloud2.local, T2, c2NoT);
  cloud2.updateWorld();

  // Directional light (sun) parameters: animate around Y axis
  lightAngle += 0.002 / clock.dt; // speed; increase for faster rotation
  const elevation = -0.5; // negative = pointing downward
  const horiz = 0.6;

  sunDir[0] = Math.cos(lightAngle) * horiz;
  sunDir[1] = elevation;
  sunDir[2] = Math.sin(lightAngle) * horiz;

  vec3.normalize(sunDir, sunDir);

  // Build a view matrix for the light looking at the scene center along -sunDir
  vec3.scale(lightEye, sunDir, -50.0);
  mat4.lookAt(lightView, lightEye, [0, 0, 0], [0, 1, 0]);
  mat4.ortho(lightProj, -30, 30, -30, 30, 1, 120);
  mat4.multiply(lightVP, lightProj, lightView);

  // Shadow pass
  gl.glBindFramebuffer(GL_FRAMEBUFFER, shadow.fbo[0]); // GL_FRAMEBUFFER
  gl.glViewport(0, 0, shadow.size, shadow.size);
  gl.glClear(GL_DEPTH_BUFFER_BIT);
  // Use back-face culling in shadow pass (reduces gaps at contact)
  gl.glCullFace(GL_BACK);
  // Apply slope-scaled depth bias for shadow rendering
  gl.glEnable(GL_POLYGON_OFFSET_FILL);
  gl.glPolygonOffset(0.8, 1.0);
  shadowShader.use();
  shadowShader.setMat4(uShadowLightVP, lightVP);
  // Traverse the scene graph and render depth for all nodes
  const drawShadowNode = (node: any) => {
    shadowShader.setMat4(uShadowModel, node.model);
    for (const mesh of node.meshes) {
      mesh.geometry.bind(shadowShader);
      if (mesh.geometry.ebo && mesh.geometry.indexType != null) {
        gl.glDrawElements(
          GL_TRIANGLES,
          mesh.geometry.count,
          mesh.geometry.indexType,
          0
        );
      } else {
        gl.glDrawArrays(GL_TRIANGLES, 0, mesh.geometry.count);
      }
      mesh.geometry.unbind(shadowShader);
    }
    for (const ch of node.children) drawShadowNode(ch);
  };
  drawShadowNode(root);
  // Disable polygon offset and restore backface culling for main scene rendering
  gl.glDisable(GL_POLYGON_OFFSET_FILL);
  gl.glCullFace(GL_BACK);
  gl.glBindFramebuffer(GL_FRAMEBUFFER, 0); // back to default

  // Use main shader and set frame-constant uniforms, including light and shadow
  shader.use();
  shader.setMat4(uProjection, persp);
  shader.setVec3(uLightDir, sunDir);
  shader.setVec3(uViewPos, eye);
  shader.setFloat(uShininess, 32.0);
  shader.setMat4(uLightVP, lightVP);
  gl.glActiveTexture(GL_TEXTURE1); // GL_TEXTURE1
  gl.glBindTexture(GL_TEXTURE_2D, shadow.depthTex[0]); // GL_TEXTURE_2D
  shader.setInt(uShadowMap, 1);
  shader.setVec2(uShadowTexelSize, 1.0 / shadow.size, 1.0 / shadow.size);
  // Natural lighting controls
  shader.setFloat(uAmbientStrength, 0.35);
  shader.setFloat(uSpecularStrength, 0.25);
  shader.setVec3(uSkyColor, skyColor);
  shader.setVec3(uGroundColor, groundColor);
  // Approximate sun angular size -> penumbra width in UV (tuneable). Start small for crisp but soft edges.
  shader.setFloat(uLightSizeUV, 2.0); // in texel units; larger = softer shadows
  // Scale PCSS radius to get softer edges overall; large scenes like clouds benefit from larger penumbra
  shader.setFloat(uPenumbraScale, 100.0);
  // Lighten very soft shadows (e.g., high clouds) so they don't go fully dark
  shader.setFloat(uMaxShadowLighten, 0.35);

  // Geometry pass: render scene into GBuffer (currently only albedo + depth)
  gl.glBindFramebuffer(GL_FRAMEBUFFER, gbuffer.fbo[0]);
  gl.glViewport(0, 0, fbW, fbH);
  gl.glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
  // Traverse the scene graph and render all nodes
  const drawMainNode = (node: any) => {
    mat4.multiply(mv, view, node.model);
    shader.setMat4(uModelView, mv);
    shader.setMat4(uModel, node.model);
    for (const mesh of node.meshes) mesh.draw();
    for (const ch of node.children) drawMainNode(ch);
  };
  drawMainNode(root);
  gl.glBindFramebuffer(GL_FRAMEBUFFER, 0);

  // Post pass: draw fullscreen quad sampling albedo texture
  postShader.use();
  // Ensure default framebuffer is ready and depth test doesn't cull the quad
  gl.glViewport(0, 0, fbW, fbH);
  gl.glClear(GL_COLOR_BUFFER_BIT);
  gl.glDisable(GL_DEPTH_TEST);
  gl.glActiveTexture(GL_TEXTURE0);
  gl.glBindTexture(GL_TEXTURE_2D, gbuffer.albedoTex[0]);
  postShader.setInt(uTex, 0);
  gl.glBindBuffer(GL_ARRAY_BUFFER, quadVBO[0]);
  gl.glEnableVertexAttribArray(aQuadPos);
  gl.glVertexAttribPointer(aQuadPos, 2, GL_FLOAT, 0, 0, 0);
  gl.glBindBuffer(GL_ARRAY_BUFFER, quadTBO[0]);
  gl.glEnableVertexAttribArray(aQuadUV);
  gl.glVertexAttribPointer(aQuadUV, 2, GL_FLOAT, 0, 0, 0);
  gl.glDrawArrays(GL_TRIANGLES, 0, 6); // GL_TRIANGLES
  gl.glDisableVertexAttribArray(aQuadPos);
  gl.glDisableVertexAttribArray(aQuadUV);

  gl.glfwSwapBuffers(window);
  gl.glfwPollEvents();
}

gl.glfwDestroyWindow(window);
gl.glfwTerminate();
