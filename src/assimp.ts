import { mat4 } from "gl-matrix";
import { Geometry } from "./geometry";
import { Mesh } from "./mesh";
import { Shader } from "./shader";
import { Node, NodeIO, Primitive } from "@gltf-transform/core";
import { Material } from "./material";

export class SceneNode {
  name: string;
  local: mat4;
  model: mat4;
  meshes: Mesh[];
  parent: SceneNode | null;
  children: SceneNode[];

  constructor(
    name: string,
    local: mat4,
    model: mat4,
    meshes: Mesh[],
    parent: SceneNode | null = null
  ) {
    this.name = name;
    this.local = local;
    this.model = model;
    this.meshes = meshes;
    this.parent = parent;
    this.children = [];
  }

  addChild(child: SceneNode) {
    child.parent = this;
    this.children.push(child);
    // Update child's world (and descendants) to be relative to this node
    child.updateWorld(this.model);
  }

  removeChild(child: SceneNode): boolean {
    const i = this.children.indexOf(child);
    if (i >= 0) {
      this.children.splice(i, 1);
      child.parent = null;
      return true;
    }
    return false;
  }

  updateWorld(parentWorld?: mat4) {
    const pw =
      parentWorld ??
      (this.parent ? this.parent.model : (mat4.create() as mat4));
    this.model = mat4.multiply(mat4.create(), pw, this.local);
    for (const ch of this.children) ch.updateWorld(this.model);
  }

  *walk(): Generator<SceneNode> {
    yield this;
    for (const ch of this.children) yield* ch.walk();
  }

  findByName(name: string): SceneNode | null {
    for (const n of this.walk()) if (n.name === name) return n;
    return null;
  }

  static findByName(
    root: SceneNode | SceneNode[],
    name: string
  ): SceneNode | null {
    if (Array.isArray(root)) {
      for (const r of root) {
        const f = r.findByName(name);
        if (f) return f;
      }
      return null;
    }
    return root.findByName(name);
  }
}

function extractPrimitive(prim: Primitive) {
  const posAcc = prim.getAttribute("POSITION");
  if (!posAcc) throw new Error("POSITION attribute missing");
  const normAcc = prim.getAttribute("NORMAL");
  const colAcc = prim.getAttribute("COLOR_0");
  const idxAcc = prim.getIndices();

  const posSrc = posAcc.getArray()!;
  const positions =
    posSrc instanceof Float32Array ? posSrc : Float32Array.from(posSrc);

  const normSrc = normAcc?.getArray();
  let normals =
    normSrc instanceof Float32Array
      ? normSrc
      : normSrc
      ? Float32Array.from(normSrc)
      : undefined;

  const colSrc = colAcc?.getArray();
  let colors: Float32Array | undefined;
  if (colSrc) {
    if (colSrc instanceof Float32Array) colors = colSrc;
    else if (colSrc instanceof Uint8Array)
      colors = Float32Array.from(colSrc, (v) => v / 255);
    else if (colSrc instanceof Uint16Array)
      colors = Float32Array.from(colSrc, (v) => v / 65535);
    else colors = Float32Array.from(colSrc);
    if (colors) {
      const comps = colors.length / (positions.length / 3);
      if (comps === 4) {
        const c3 = new Float32Array((positions.length / 3) * 3);
        for (let i = 0, j = 0; i < colors.length; i += 4, j += 3) {
          c3[j] = colors[i];
          c3[j + 1] = colors[i + 1];
          c3[j + 2] = colors[i + 2];
        }
        colors = c3;
      }
    }
  }

  let indices: Uint8Array | Uint16Array | Uint32Array | undefined;
  if (idxAcc) {
    indices = idxAcc.getArray()! as Uint8Array | Uint16Array | Uint32Array;
  }

  // If normals are missing, compute (smooth) normals if we have indices, else flat.
  if (!normals) {
    normals = new Float32Array(positions.length);
    if (indices) {
      for (let i = 0; i < indices.length; i += 3) {
        const ia = indices[i];
        const ib = indices[i + 1];
        const ic = indices[i + 2];
        const ax = positions[ia * 3 + 0],
          ay = positions[ia * 3 + 1],
          az = positions[ia * 3 + 2];
        const bx = positions[ib * 3 + 0],
          by = positions[ib * 3 + 1],
          bz = positions[ib * 3 + 2];
        const cx = positions[ic * 3 + 0],
          cy = positions[ic * 3 + 1],
          cz = positions[ic * 3 + 2];
        const ux = bx - ax,
          uy = by - ay,
          uz = bz - az;
        const vx = cx - ax,
          vy = cy - ay,
          vz = cz - az;
        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;
        normals[ia * 3 + 0] += nx;
        normals[ia * 3 + 1] += ny;
        normals[ia * 3 + 2] += nz;
        normals[ib * 3 + 0] += nx;
        normals[ib * 3 + 1] += ny;
        normals[ib * 3 + 2] += nz;
        normals[ic * 3 + 0] += nx;
        normals[ic * 3 + 1] += ny;
        normals[ic * 3 + 2] += nz;
      }
      for (let v = 0; v < normals.length; v += 3) {
        const nx = normals[v + 0],
          ny = normals[v + 1],
          nz = normals[v + 2];
        const len = Math.hypot(nx, ny, nz) || 1;
        normals[v + 0] = nx / len;
        normals[v + 1] = ny / len;
        normals[v + 2] = nz / len;
      }
    } else {
      for (let i = 0; i < positions.length; i += 9) {
        const ax = positions[i + 0],
          ay = positions[i + 1],
          az = positions[i + 2];
        const bx = positions[i + 3],
          by = positions[i + 4],
          bz = positions[i + 5];
        const cx = positions[i + 6],
          cy = positions[i + 7],
          cz = positions[i + 8];
        const ux = bx - ax,
          uy = by - ay,
          uz = bz - az;
        const vx = cx - ax,
          vy = cy - ay,
          vz = cz - az;
        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;
        const len = Math.hypot(nx, ny, nz) || 1;
        nx /= len;
        ny /= len;
        nz /= len;
        normals[i + 0] = nx;
        normals[i + 1] = ny;
        normals[i + 2] = nz;
        normals[i + 3] = nx;
        normals[i + 4] = ny;
        normals[i + 5] = nz;
        normals[i + 6] = nx;
        normals[i + 7] = ny;
        normals[i + 8] = nz;
      }
    }
  }

  return { positions, normals, colors, indices };
}

export async function loadSceneGraph(
  path: string,
  shader: Shader
): Promise<SceneNode[]> {
  const io = new NodeIO();
  const doc = await io.read(path);
  const root = doc.getRoot();
  const scene = root.getDefaultScene?.() ?? root.listScenes()[0];
  if (!scene) throw new Error("No scene in glTF");

  const roots: SceneNode[] = [];
  const geomCache = new Map<any, Geometry>();
  const meshCache = new Map<any, Mesh>();

  function localMatrix(node: Node) {
    const m = node.getMatrix?.();
    if (m && m.length === 16) return Float32Array.from(m);
    const t = node.getTranslation?.() ?? [0, 0, 0];
    const r = node.getRotation?.() ?? [0, 0, 0, 1];
    const s = node.getScale?.() ?? [1, 1, 1];
    const out = mat4.create();
    mat4.fromRotationTranslationScale(out, r, t, s);
    return out;
  }

  function buildNode(
    src: Node,
    parentWorld: mat4,
    parent: SceneNode | null
  ): SceneNode {
    const lm = localMatrix(src);
    const world = mat4.multiply(mat4.create(), parentWorld, lm);
    const meshObj = src.getMesh?.();
    const meshes: Mesh[] = [];
    if (meshObj) {
      const prims = meshObj.listPrimitives();
      for (const prim of prims) {
        let geom = geomCache.get(prim);
        let mesh = meshCache.get(prim);
        if (!geom) {
          const data = extractPrimitive(prim);
          geom = new Geometry(
            data.positions,
            data.normals,
            data.colors,
            data.indices
          );
          geomCache.set(prim, geom);
        }
        if (!mesh) {
          const mat = prim.getMaterial?.() ?? null;
          const material = Material.fromGLTF(mat);
          mesh = new Mesh(geom, shader, material);
          meshCache.set(prim, mesh);
        }
        meshes.push(mesh!);
      }
    }
    const name = (src.getName?.() as string) ?? "";
    const node = new SceneNode(name, lm, world, meshes, parent);
    const children = src.listChildren?.() ?? [];
    for (const ch of children) {
      const child = buildNode(ch, world, node);
      child.parent = node;
      node.children.push(child);
    }
    return node;
  }

  const srcRoots = scene.listChildren?.() ?? [];
  const I = mat4.create();
  for (const n of srcRoots) roots.push(buildNode(n, I, null));
  return roots;
}
