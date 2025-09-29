#version 120

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aColor;

uniform mat4 uProjection;
uniform mat4 uModelView;
uniform mat4 uLightVP; // light view-projection
uniform mat4 uModel;   // model matrix (world)
uniform float uUseVertexColor;
uniform vec3 uBaseColor;

varying vec3 vNormal;
varying vec3 vPosition; // world space
varying vec3 vColor;
varying vec4 vShadowCoord;

void main(){
  vec4 wp = uModel * vec4(aPosition,1.0);
  vPosition = wp.xyz;
  // Use world-space normal (assumes uniform scaling)
  vNormal = mat3(uModel) * aNormal;
  vColor = mix(uBaseColor, aColor, clamp(uUseVertexColor, 0.0, 1.0));
  vShadowCoord = uLightVP * (uModel * vec4(aPosition, 1.0));
  gl_Position = uProjection * (uModelView * vec4(aPosition,1.0));
}