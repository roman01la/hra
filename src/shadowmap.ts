import * as gl from "./ffi";

const GL_TEXTURE_2D = 0x0de1;
const GL_DEPTH_COMPONENT = 0x1902;
const GL_UNSIGNED_INT = 0x1405;
const GL_NEAREST = 0x2600;
const GL_LINEAR = 0x2601;
const GL_CLAMP_TO_EDGE = 0x812f;
const GL_FRAMEBUFFER = 0x8d40;
const GL_DEPTH_ATTACHMENT = 0x8d00;
const GL_FRAMEBUFFER_COMPLETE = 0x8cd5;
const GL_NONE = 0;
const MIN_FILTER = 0x2801;
const MAG_FILTER = 0x2800;
const WRAP_S = 0x2802;
const WRAP_T = 0x2803;

export class ShadowMap {
  fbo: Uint32Array = new Uint32Array(1);
  depthTex: Uint32Array = new Uint32Array(1);
  size: number;

  constructor(size = 1024) {
    this.size = size;
    gl.glGenFramebuffers(1, this.fbo);
    gl.glGenTextures(1, this.depthTex);
    gl.glBindTexture(GL_TEXTURE_2D, this.depthTex[0]);
    gl.glTexImage2D(
      GL_TEXTURE_2D,
      0,
      GL_DEPTH_COMPONENT,
      size,
      size,
      0,
      GL_DEPTH_COMPONENT,
      GL_UNSIGNED_INT,
      0
    );
    gl.glTexParameteri(GL_TEXTURE_2D, MIN_FILTER, GL_LINEAR);
    gl.glTexParameteri(GL_TEXTURE_2D, MAG_FILTER, GL_LINEAR);
    gl.glTexParameteri(GL_TEXTURE_2D, WRAP_S, GL_CLAMP_TO_EDGE);
    gl.glTexParameteri(GL_TEXTURE_2D, WRAP_T, GL_CLAMP_TO_EDGE);

    gl.glBindFramebuffer(GL_FRAMEBUFFER, this.fbo[0]);
    gl.glFramebufferTexture2D(
      GL_FRAMEBUFFER,
      GL_DEPTH_ATTACHMENT,
      GL_TEXTURE_2D,
      this.depthTex[0],
      0
    );
    gl.glDrawBuffer(GL_NONE);
    gl.glReadBuffer(GL_NONE);
    const status = gl.glCheckFramebufferStatus(GL_FRAMEBUFFER);
    if (status !== GL_FRAMEBUFFER_COMPLETE) {
      throw new Error("Shadow FBO incomplete: status=0x" + status.toString(16));
    }
    gl.glBindFramebuffer(GL_FRAMEBUFFER, 0);
  }
}
