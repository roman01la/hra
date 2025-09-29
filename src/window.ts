import { FFIType, JSCallback } from "bun:ffi";
import * as gl from "./ffi";

export function createWindow(width: number, height: number, title: string) {
  if (!gl.glfwInit()) {
    console.error("Failed to initialize GLFW");
    process.exit(1);
  }

  const window = gl.glfwCreateWindow(
    width,
    height,
    gl.stringPtr(title),
    null,
    null
  );

  if (!window) {
    console.error("Failed to create GLFW window");
    gl.glfwTerminate();
    process.exit(1);
  }

  const key_callback = new JSCallback(
    (window, key, scancode, action, mods) => {
      if (key == 256 && action == 1) {
        gl.glfwSetWindowShouldClose(window, 1);
      }
    },
    {
      returns: FFIType.void,
      args: [
        FFIType.pointer,
        FFIType.int,
        FFIType.int,
        FFIType.int,
        FFIType.int,
      ],
    }
  );

  gl.glfwMakeContextCurrent(window);
  gl.glfwSwapInterval(1);
  gl.glfwSetKeyCallback(window, key_callback.ptr);

  gl.glClearColor(0.1, 0.5, 0.6, 1.0);

  return window;
}
