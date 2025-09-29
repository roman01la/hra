import { mat4, vec3 } from "gl-matrix";
import * as gl from "./ffi";
import { Pointer } from "bun:ffi";

export class Shader {
  program: number;

  constructor(vertexSrc: string, fragmentSrc: string) {
    const vs = this.compile(0x8b31, vertexSrc);
    const fs = this.compile(0x8b30, fragmentSrc);
    const program = gl.glCreateProgram();
    gl.glAttachShader(program, vs);
    gl.glAttachShader(program, fs);
    gl.glLinkProgram(program);
    const ok = new Int32Array(1);
    gl.glGetProgramiv(program, 0x8b82, ok);
    if (!ok[0]) {
      const log = new Uint8Array(4096);
      gl.glGetProgramInfoLog(program, log.length, 0, log);
      const msg = new TextDecoder().decode(log).replace(/\0+$/, "");
      throw new Error("Program link failed: " + msg);
    }
    this.program = program;
  }

  private makeCStringPtrArray(cstrPtr: Pointer | bigint | number): Uint8Array {
    const buf = new ArrayBuffer(8);
    const dv = new DataView(buf);
    const asBig =
      typeof cstrPtr === "bigint" ? cstrPtr : BigInt(Number(cstrPtr));
    dv.setBigUint64(0, asBig, true);
    return new Uint8Array(buf);
  }

  private compile(type: number, source: string): number {
    const shader = gl.glCreateShader(type);
    const srcPtr = gl.stringPtr(source);
    const arr = this.makeCStringPtrArray(srcPtr as unknown as number);
    gl.glShaderSource(shader, 1, arr, 0);
    gl.glCompileShader(shader);
    const ok = new Int32Array(1);
    gl.glGetShaderiv(shader, 0x8b81, ok);
    if (!ok[0]) {
      const log = new Uint8Array(4096);
      gl.glGetShaderInfoLog(shader, log.length, 0, log);
      const msg = new TextDecoder().decode(log).replace(/\0+$/, "");
      throw new Error("Shader compile failed: " + msg);
    }
    return shader;
  }

  use() {
    gl.glUseProgram(this.program);
  }

  attrib(name: string): number {
    return gl.glGetAttribLocation(this.program, gl.stringPtr(name));
  }

  uniform(name: string): number {
    return gl.glGetUniformLocation(this.program, gl.stringPtr(name));
  }

  setMat4(loc: number, m: mat4) {
    gl.glUniformMatrix4fv(loc, 1, 0, m as Float32Array);
  }

  setVec3(loc: number, color: vec3) {
    gl.glUniform3f(loc, color[0], color[1], color[2]);
  }

  setFloat(loc: number, v: number) {
    gl.glUniform1f(loc, v);
  }

  setInt(loc: number, v: number) {
    gl.glUniform1i(loc, v);
  }

  setVec2(loc: number, x: number, y: number) {
    gl.glUniform2f(loc, x, y);
  }
}
