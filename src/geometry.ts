import * as gl from "./ffi";
import { ptr } from "bun:ffi";
import { Shader } from "./shader";

const GL_ARRAY_BUFFER = 0x8892;
const GL_STATIC_DRAW = 0x88e4;
const GL_FLOAT = 0x1406;
const GL_ELEMENT_ARRAY_BUFFER = 0x8893;
const GL_UNSIGNED_BYTE = 0x1401;
const GL_UNSIGNED_SHORT = 0x1403;
const GL_UNSIGNED_INT = 0x1405;

export class Geometry {
  vbo: Uint32Array | null = null;
  nbo: Uint32Array | null = null;
  cbo: Uint32Array | null = null;
  ebo: Uint32Array | null = null;
  count: number;
  indexType: number | null = null;

  constructor(
    public positions: Float32Array,
    public normals?: Float32Array,
    public colors?: Float32Array,
    public indices?: Uint8Array | Uint16Array | Uint32Array
  ) {
    this.count = indices ? indices.length : positions.length / 3;
    // positions
    this.vbo = new Uint32Array(1);
    gl.glGenBuffers(1, this.vbo);
    gl.glBindBuffer(GL_ARRAY_BUFFER, this.vbo[0]);
    gl.glBufferData(
      GL_ARRAY_BUFFER,
      positions.byteLength,
      ptr(positions),
      GL_STATIC_DRAW
    );
    // normals
    if (normals) {
      this.nbo = new Uint32Array(1);
      gl.glGenBuffers(1, this.nbo);
      gl.glBindBuffer(GL_ARRAY_BUFFER, this.nbo[0]);
      gl.glBufferData(
        GL_ARRAY_BUFFER,
        normals.byteLength,
        ptr(normals),
        GL_STATIC_DRAW
      );
    }
    // colors
    if (colors) {
      this.cbo = new Uint32Array(1);
      gl.glGenBuffers(1, this.cbo);
      gl.glBindBuffer(GL_ARRAY_BUFFER, this.cbo[0]);
      gl.glBufferData(
        GL_ARRAY_BUFFER,
        colors.byteLength,
        ptr(colors),
        GL_STATIC_DRAW
      );
    }
    // indices
    if (indices) {
      this.ebo = new Uint32Array(1);
      gl.glGenBuffers(1, this.ebo);
      gl.glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, this.ebo[0]);
      gl.glBufferData(
        GL_ELEMENT_ARRAY_BUFFER,
        indices.byteLength,
        ptr(indices),
        GL_STATIC_DRAW
      );
      if (indices instanceof Uint32Array) this.indexType = GL_UNSIGNED_INT;
      else if (indices instanceof Uint16Array)
        this.indexType = GL_UNSIGNED_SHORT;
      else this.indexType = GL_UNSIGNED_BYTE;
    }
  }

  bind(shader: Shader) {
    const aPos = shader.attrib("aPosition");
    if (aPos >= 0) {
      gl.glBindBuffer(GL_ARRAY_BUFFER, this.vbo![0]);
      gl.glEnableVertexAttribArray(aPos);
      gl.glVertexAttribPointer(aPos, 3, GL_FLOAT, 0, 0, 0);
    }

    if (this.nbo) {
      const aNormal = shader.attrib("aNormal");
      if (aNormal >= 0) {
        gl.glBindBuffer(GL_ARRAY_BUFFER, this.nbo[0]);
        gl.glEnableVertexAttribArray(aNormal);
        gl.glVertexAttribPointer(aNormal, 3, GL_FLOAT, 0, 0, 0);
      }
    }

    if (this.cbo) {
      const aColor = shader.attrib("aColor");
      if (aColor >= 0) {
        gl.glBindBuffer(GL_ARRAY_BUFFER, this.cbo[0]);
        gl.glEnableVertexAttribArray(aColor);
        gl.glVertexAttribPointer(aColor, 3, GL_FLOAT, 0, 0, 0);
      }
    }
    if (this.ebo) {
      gl.glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, this.ebo[0]);
    }
  }

  unbind(shader: Shader) {
    const aPos = shader.attrib("aPosition");
    if (aPos >= 0) gl.glDisableVertexAttribArray(aPos);
    if (this.nbo) {
      const aNormal = shader.attrib("aNormal");
      if (aNormal >= 0) gl.glDisableVertexAttribArray(aNormal);
    }
    if (this.cbo) {
      const aColor = shader.attrib("aColor");
      if (aColor >= 0) gl.glDisableVertexAttribArray(aColor);
    }
    // Note: leaving EBO bound is fine as it's part of VAO state; since we don't have VAOs,
    // we don't explicitly unbind here to keep binding for drawElements.
  }
}
