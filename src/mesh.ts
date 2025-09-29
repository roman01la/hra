import * as gl from "./ffi";
import { Geometry } from "./geometry";
import { Shader } from "./shader";
import { Material } from "./material";

const GL_TRIANGLES = 0x0004;

export class Mesh {
  constructor(
    public geometry: Geometry,
    public shader: Shader,
    public material: Material = new Material()
  ) {}

  draw() {
    this.shader.use();
    this.material.apply(this.shader, !!this.geometry.colors);
    this.geometry.bind(this.shader);
    if (this.geometry.ebo && this.geometry.indexType != null) {
      gl.glDrawElements(
        GL_TRIANGLES,
        this.geometry.count,
        this.geometry.indexType,
        0
      );
    } else {
      gl.glDrawArrays(GL_TRIANGLES, 0, this.geometry.count);
    }
    this.geometry.unbind(this.shader);
  }
}
