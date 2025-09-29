import { vec3 } from "gl-matrix";
import { Shader } from "./shader";

export class Material {
  baseColor: vec3;
  shininess: number; // mapped from roughness

  constructor(baseColor: vec3 = vec3.fromValues(1, 1, 1), shininess = 32) {
    this.baseColor = baseColor;
    this.shininess = shininess;
  }

  static fromGLTF(mat: any | null | undefined): Material {
    if (!mat) return new Material();
    // Try to read baseColorFactor and roughness
    let color: vec3 = vec3.fromValues(1, 1, 1);
    let roughness = 0.5;
    try {
      const factor = mat.getBaseColorFactor?.();
      if (factor && factor.length >= 3) {
        color = vec3.fromValues(factor[0], factor[1], factor[2]);
      }
    } catch {}
    try {
      const rf = mat.getRoughnessFactor?.();
      if (typeof rf === "number") roughness = rf;
    } catch {}
    try {
      const pbr = mat.getPBRMetallicRoughness?.();
      if (pbr) {
        const factor = pbr.getBaseColorFactor?.();
        if (factor && factor.length >= 3) {
          color = vec3.fromValues(factor[0], factor[1], factor[2]);
        }
        const rf = pbr.getRoughnessFactor?.();
        if (typeof rf === "number") roughness = rf;
      }
    } catch {}
    const shininess = Material.shininessFromRoughness(roughness);
    return new Material(color, shininess);
  }

  static shininessFromRoughness(roughness: number): number {
    // Map roughness [0..1] to Blinn-Phong shininess ~ [128..4]
    const r = Math.min(Math.max(roughness, 0), 1);
    return Math.max(4, Math.round((1 - r) * 124 + 4));
  }

  apply(shader: Shader, hasVertexColor: boolean) {
    const uBaseColor = shader.uniform("uBaseColor");
    const uUseVertexColor = shader.uniform("uUseVertexColor");
    const uShininess = shader.uniform("uShininess");
    shader.setFloat(uUseVertexColor, hasVertexColor ? 1 : 0);
    shader.setVec3(uBaseColor, this.baseColor);
    shader.setFloat(uShininess, this.shininess);
  }
}
