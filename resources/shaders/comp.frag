uniform sampler2D uTex;

varying vec2 vUV;

void main(){
  vec3 color = texture2D(uTex, vUV).rgb;
  // Gamma correct from linear to sRGB
  color = pow(color, vec3(1.0/2.2));
  gl_FragColor = vec4(color, 1.0);
}