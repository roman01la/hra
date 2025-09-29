import * as gl from "./ffi";

const GL_TEXTURE_2D = 0x0de1;
const GL_RGB = 0x1907;
const GL_RGBA = 0x1908;
const GL_UNSIGNED_BYTE = 0x1401;
const GL_NEAREST = 0x2600;
const GL_CLAMP_TO_EDGE = 0x812f;
const GL_COLOR_ATTACHMENT0 = 0x8ce0;
const GL_FRAMEBUFFER = 0x8d40;
const GL_RENDERBUFFER = 0x8d41;
const GL_DEPTH_COMPONENT24 = 0x81a6;
const GL_DEPTH_ATTACHMENT = 0x8d00;
const GL_FRAMEBUFFER_COMPLETE = 0x8cd5;
const MIN_FILTER = 0x2801;
const MAG_FILTER = 0x2800;
const WRAP_S = 0x2802;
const WRAP_T = 0x2803;

export class GBuffer {
  fbo: Uint32Array;
  depthRb: Uint32Array;
  albedoTex: Uint32Array;
  width = 0;
  height = 0;

  constructor(w: number, h: number) {
    this.fbo = new Uint32Array(1);
    this.depthRb = new Uint32Array(1);
    this.albedoTex = new Uint32Array(1);
    this.resize(w, h);
  }

  private createTex(w: number, h: number) {
    gl.glGenTextures(1, this.albedoTex);
    gl.glBindTexture(GL_TEXTURE_2D, this.albedoTex[0]);
    gl.glTexImage2D(
      GL_TEXTURE_2D,
      0,
      GL_RGBA,
      w,
      h,
      0,
      GL_RGBA,
      GL_UNSIGNED_BYTE,
      0
    );
    gl.glTexParameteri(GL_TEXTURE_2D, MIN_FILTER, GL_NEAREST); // MIN_FILTER
    gl.glTexParameteri(GL_TEXTURE_2D, MAG_FILTER, GL_NEAREST); // MAG_FILTER
    gl.glTexParameteri(GL_TEXTURE_2D, WRAP_S, GL_CLAMP_TO_EDGE); // WRAP_S
    gl.glTexParameteri(GL_TEXTURE_2D, WRAP_T, GL_CLAMP_TO_EDGE); // WRAP_T
  }

  private createDepth(w: number, h: number) {
    gl.glGenRenderbuffers(1, this.depthRb);
    gl.glBindRenderbuffer(GL_RENDERBUFFER, this.depthRb[0]);
    gl.glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH_COMPONENT24, w, h);
  }

  resize(w: number, h: number) {
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    if (!this.fbo[0]) gl.glGenFramebuffers(1, this.fbo);
    gl.glBindFramebuffer(GL_FRAMEBUFFER, this.fbo[0]);
    this.createTex(w, h);
    this.createDepth(w, h);
    gl.glFramebufferTexture2D(
      GL_FRAMEBUFFER,
      GL_COLOR_ATTACHMENT0,
      GL_TEXTURE_2D,
      this.albedoTex[0],
      0
    );
    gl.glFramebufferRenderbuffer(
      GL_FRAMEBUFFER,
      GL_DEPTH_ATTACHMENT,
      GL_RENDERBUFFER,
      this.depthRb[0]
    );
    const status = gl.glCheckFramebufferStatus(GL_FRAMEBUFFER);
    if (status !== GL_FRAMEBUFFER_COMPLETE) {
      throw new Error("GBuffer incomplete: status=0x" + status.toString(16));
    }
    gl.glBindFramebuffer(GL_FRAMEBUFFER, 0);
  }
}
