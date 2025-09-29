import { mat4, vec3 } from "gl-matrix";

export class Camera {
  center: vec3;
  radius: number;
  angle: number = 0;
  heightFactor: number = 0.6;
  fovY: number; // radians
  aspect: number = 4 / 3;
  near: number;
  far: number;

  constructor(
    center: vec3,
    radius: number,
    fovY = Math.PI / 3,
    near = 0.1,
    far?: number
  ) {
    this.center = vec3.clone(center);
    this.radius = Math.max(radius, 0.001);
    this.fovY = fovY;
    this.near = near;
    this.far = far ?? radius * 10 + near;
  }

  setAspect(w: number, h: number) {
    this.aspect = Math.max(w / Math.max(h, 1), 1e-3);
  }

  projection(): mat4 {
    return mat4.perspective(
      mat4.create(),
      this.fovY,
      this.aspect,
      this.near,
      this.far
    );
  }

  view(): mat4 {
    const eye = this.eye();
    const up = vec3.fromValues(0, 1, 0);
    return mat4.lookAt(mat4.create(), eye, this.center, up);
  }

  eye(): vec3 {
    const y = this.center[1] + this.radius * this.heightFactor;
    const x = this.center[0] + Math.sin(this.angle) * this.radius;
    const z = this.center[2] + Math.cos(this.angle) * this.radius;
    return vec3.fromValues(x, y, z);
  }
}
