import { dlopen, FFIType, suffix, ptr, Pointer } from "bun:ffi";

const GLFW_PATH =
  process.env.GLFW_PATH ||
  `/opt/homebrew/Cellar/glfw/3.4/lib/libglfw.${suffix}`;
const OPENGL_PATH =
  process.env.OPENGL_PATH ||
  "/System/Library/Frameworks/OpenGL.framework/OpenGL";

const lib = dlopen("libbullet.dylib", {
  createEmptyDynamicsWorld: {
    args: [],
    returns: FFIType.void,
  },
});

console.log(lib.symbols.createEmptyDynamicsWorld());

const {
  symbols: {
    glfwInit,
    glfwCreateWindow,
    glfwTerminate,
    glfwMakeContextCurrent,
    glfwSwapInterval,
    glfwWindowShouldClose,
    glfwSwapBuffers,
    glfwPollEvents,
    glfwDestroyWindow,
    glfwSetKeyCallback,
    glfwSetWindowShouldClose,
    glfwGetFramebufferSize,
    glfwGetTime,
  },
} = dlopen(GLFW_PATH, {
  glfwInit: {
    args: [],
    returns: FFIType.int,
  },
  glfwCreateWindow: {
    args: [
      FFIType.int,
      FFIType.int,
      FFIType.cstring,
      FFIType.pointer,
      FFIType.pointer,
    ],
    returns: FFIType.pointer,
  },
  glfwTerminate: {
    args: [],
    returns: FFIType.void,
  },
  glfwMakeContextCurrent: {
    args: [FFIType.pointer],
    returns: FFIType.void,
  },
  glfwSwapInterval: {
    args: [FFIType.int],
    returns: FFIType.void,
  },
  glfwWindowShouldClose: {
    args: [FFIType.pointer],
    returns: FFIType.int,
  },
  glfwSwapBuffers: {
    args: [FFIType.pointer],
    returns: FFIType.void,
  },
  glfwPollEvents: {
    args: [],
    returns: FFIType.void,
  },
  glfwDestroyWindow: {
    args: [FFIType.pointer],
    returns: FFIType.void,
  },
  glfwSetKeyCallback: {
    args: [FFIType.pointer, FFIType.pointer],
    returns: FFIType.pointer,
  },
  glfwSetWindowShouldClose: {
    args: [FFIType.pointer, FFIType.int],
    returns: FFIType.void,
  },
  glfwGetFramebufferSize: {
    args: [FFIType.pointer, FFIType.pointer, FFIType.pointer],
    returns: FFIType.void,
  },
  glfwGetTime: {
    args: [],
    returns: FFIType.double,
  },
});

const {
  symbols: {
    glClearColor,
    glClear,
    glBegin,
    glEnd,
    glVertex2f,
    glVertex3f,
    glColor3f,
    glViewport,
    glMatrixMode,
    glLoadIdentity,
    glLoadMatrixf,
    glRotatef,
    glTranslatef,
    glEnable,
    glDisable,
    glDepthFunc,
    glGenBuffers,
    glBindBuffer,
    glBufferData,
    glEnableClientState,
    glDisableClientState,
    glVertexPointer,
    glColorPointer,
    glDrawArrays,
    glDrawElements,
    glCreateShader,
    glShaderSource,
    glCompileShader,
    glGetShaderiv,
    glGetShaderInfoLog,
    glCreateProgram,
    glAttachShader,
    glLinkProgram,
    glGetProgramiv,
    glGetProgramInfoLog,
    glUseProgram,
    glGetUniformLocation,
    glUniformMatrix4fv,
    glUniform3f,
    glUniform2f,
    glUniform1f,
    glGetAttribLocation,
    glEnableVertexAttribArray,
    glDisableVertexAttribArray,
    glVertexAttribPointer,
    glGenTextures,
    glBindTexture,
    glTexImage2D,
    glTexParameteri,
    glActiveTexture,
    glUniform1i,
    glGenFramebuffers,
    glBindFramebuffer,
    glFramebufferTexture2D,
    glCheckFramebufferStatus,
    glDrawBuffers,
    glGenRenderbuffers,
    glBindRenderbuffer,
    glRenderbufferStorage,
    glFramebufferRenderbuffer,
    glDrawBuffer,
    glReadBuffer,
    glCullFace,
    glFrontFace,
    glPolygonOffset,
  },
} = dlopen(OPENGL_PATH, {
  glClearColor: {
    args: [FFIType.float, FFIType.float, FFIType.float, FFIType.float],
    returns: FFIType.void,
  },
  glClear: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glBegin: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glEnd: {
    args: [],
    returns: FFIType.void,
  },
  glVertex2f: {
    args: [FFIType.float, FFIType.float],
    returns: FFIType.void,
  },
  glVertex3f: {
    args: [FFIType.float, FFIType.float, FFIType.float],
    returns: FFIType.void,
  },
  glColor3f: {
    args: [FFIType.float, FFIType.float, FFIType.float],
    returns: FFIType.void,
  },
  glViewport: {
    args: [FFIType.int, FFIType.int, FFIType.int, FFIType.int],
    returns: FFIType.void,
  },
  glMatrixMode: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glLoadIdentity: {
    args: [],
    returns: FFIType.void,
  },
  glLoadMatrixf: {
    args: [FFIType.pointer],
    returns: FFIType.void,
  },
  glRotatef: {
    args: [FFIType.float, FFIType.float, FFIType.float, FFIType.float],
    returns: FFIType.void,
  },
  glTranslatef: {
    args: [FFIType.float, FFIType.float, FFIType.float],
    returns: FFIType.void,
  },
  glEnable: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glDisable: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glDepthFunc: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glGenBuffers: {
    args: [FFIType.int, FFIType.pointer],
    returns: FFIType.void,
  },
  glBindBuffer: {
    args: [FFIType.u32, FFIType.u32],
    returns: FFIType.void,
  },
  glBufferData: {
    args: [FFIType.u32, FFIType.u64, FFIType.pointer, FFIType.u32],
    returns: FFIType.void,
  },
  glEnableClientState: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glDisableClientState: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glVertexPointer: {
    args: [FFIType.int, FFIType.u32, FFIType.int, FFIType.pointer],
    returns: FFIType.void,
  },
  glColorPointer: {
    args: [FFIType.int, FFIType.u32, FFIType.int, FFIType.pointer],
    returns: FFIType.void,
  },
  glDrawArrays: {
    args: [FFIType.u32, FFIType.int, FFIType.int],
    returns: FFIType.void,
  },
  glDrawElements: {
    args: [FFIType.u32, FFIType.int, FFIType.u32, FFIType.pointer],
    returns: FFIType.void,
  },
  glCreateShader: {
    args: [FFIType.u32],
    returns: FFIType.u32,
  },
  glShaderSource: {
    args: [FFIType.u32, FFIType.int, FFIType.pointer, FFIType.pointer],
    returns: FFIType.void,
  },
  glCompileShader: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glGetShaderiv: {
    args: [FFIType.u32, FFIType.u32, FFIType.pointer],
    returns: FFIType.void,
  },
  glGetShaderInfoLog: {
    args: [FFIType.u32, FFIType.int, FFIType.pointer, FFIType.pointer],
    returns: FFIType.void,
  },
  glCreateProgram: {
    args: [],
    returns: FFIType.u32,
  },
  glAttachShader: {
    args: [FFIType.u32, FFIType.u32],
    returns: FFIType.void,
  },
  glLinkProgram: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glGetProgramiv: {
    args: [FFIType.u32, FFIType.u32, FFIType.pointer],
    returns: FFIType.void,
  },
  glGetProgramInfoLog: {
    args: [FFIType.u32, FFIType.int, FFIType.pointer, FFIType.pointer],
    returns: FFIType.void,
  },
  glUseProgram: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glGetUniformLocation: {
    args: [FFIType.u32, FFIType.cstring],
    returns: FFIType.int,
  },
  glUniformMatrix4fv: {
    args: [FFIType.int, FFIType.int, FFIType.u8, FFIType.pointer],
    returns: FFIType.void,
  },
  glUniform3f: {
    args: [FFIType.int, FFIType.float, FFIType.float, FFIType.float],
    returns: FFIType.void,
  },
  glUniform2f: {
    args: [FFIType.int, FFIType.float, FFIType.float],
    returns: FFIType.void,
  },
  glUniform1f: {
    args: [FFIType.int, FFIType.float],
    returns: FFIType.void,
  },
  glGetAttribLocation: {
    args: [FFIType.u32, FFIType.cstring],
    returns: FFIType.int,
  },
  glEnableVertexAttribArray: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glDisableVertexAttribArray: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glVertexAttribPointer: {
    args: [
      FFIType.u32,
      FFIType.int,
      FFIType.u32,
      FFIType.u8,
      FFIType.int,
      FFIType.pointer,
    ],
    returns: FFIType.void,
  },
  // --- Additional for FBO/Textures/MRT ---
  glGenTextures: {
    args: [FFIType.int, FFIType.pointer],
    returns: FFIType.void,
  },
  glBindTexture: {
    args: [FFIType.u32, FFIType.u32],
    returns: FFIType.void,
  },
  glTexImage2D: {
    args: [
      FFIType.u32,
      FFIType.int,
      FFIType.int,
      FFIType.int,
      FFIType.int,
      FFIType.int,
      FFIType.u32,
      FFIType.u32,
      FFIType.pointer,
    ],
    returns: FFIType.void,
  },
  glTexParameteri: {
    args: [FFIType.u32, FFIType.u32, FFIType.int],
    returns: FFIType.void,
  },
  glActiveTexture: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glUniform1i: {
    args: [FFIType.int, FFIType.int],
    returns: FFIType.void,
  },
  glGenFramebuffers: {
    args: [FFIType.int, FFIType.pointer],
    returns: FFIType.void,
  },
  glBindFramebuffer: {
    args: [FFIType.u32, FFIType.u32],
    returns: FFIType.void,
  },
  glFramebufferTexture2D: {
    args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.int],
    returns: FFIType.void,
  },
  glCheckFramebufferStatus: {
    args: [FFIType.u32],
    returns: FFIType.u32,
  },
  glDrawBuffers: {
    args: [FFIType.int, FFIType.pointer],
    returns: FFIType.void,
  },
  glGenRenderbuffers: {
    args: [FFIType.int, FFIType.pointer],
    returns: FFIType.void,
  },
  glBindRenderbuffer: {
    args: [FFIType.u32, FFIType.u32],
    returns: FFIType.void,
  },
  glRenderbufferStorage: {
    args: [FFIType.u32, FFIType.u32, FFIType.int, FFIType.int],
    returns: FFIType.void,
  },
  glFramebufferRenderbuffer: {
    args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32],
    returns: FFIType.void,
  },
  glDrawBuffer: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glReadBuffer: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glCullFace: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glFrontFace: {
    args: [FFIType.u32],
    returns: FFIType.void,
  },
  glPolygonOffset: {
    args: [FFIType.float, FFIType.float],
    returns: FFIType.void,
  },
});

export function stringPtr(str: string): Pointer {
  return ptr(new TextEncoder().encode(str + "\0"));
}

export {
  // glfw
  glfwInit,
  glfwCreateWindow,
  glfwTerminate,
  glfwMakeContextCurrent,
  glfwSwapInterval,
  glfwWindowShouldClose,
  glfwSwapBuffers,
  glfwPollEvents,
  glfwDestroyWindow,
  glfwSetKeyCallback,
  glfwSetWindowShouldClose,
  glfwGetFramebufferSize,
  glfwGetTime,

  // opengl
  glClearColor,
  glClear,
  glBegin,
  glEnd,
  glVertex2f,
  glVertex3f,
  glColor3f,
  glViewport,
  glMatrixMode,
  glLoadIdentity,
  glLoadMatrixf,
  glRotatef,
  glTranslatef,
  glEnable,
  glDisable,
  glDepthFunc,
  glGenBuffers,
  glBindBuffer,
  glBufferData,
  glEnableClientState,
  glDisableClientState,
  glVertexPointer,
  glColorPointer,
  glDrawArrays,
  glDrawElements,
  glCreateShader,
  glShaderSource,
  glCompileShader,
  glGetShaderiv,
  glGetShaderInfoLog,
  glCreateProgram,
  glAttachShader,
  glLinkProgram,
  glGetProgramiv,
  glGetProgramInfoLog,
  glUseProgram,
  glGetUniformLocation,
  glUniformMatrix4fv,
  glUniform3f,
  glUniform2f,
  glUniform1f,
  glGetAttribLocation,
  glEnableVertexAttribArray,
  glDisableVertexAttribArray,
  glVertexAttribPointer,
  glGenTextures,
  glBindTexture,
  glTexImage2D,
  glTexParameteri,
  glActiveTexture,
  glUniform1i,
  glGenFramebuffers,
  glBindFramebuffer,
  glFramebufferTexture2D,
  glCheckFramebufferStatus,
  glDrawBuffers,
  glGenRenderbuffers,
  glBindRenderbuffer,
  glRenderbufferStorage,
  glFramebufferRenderbuffer,
  glDrawBuffer,
  glReadBuffer,
  glCullFace,
  glFrontFace,
  glPolygonOffset,
};
