#version 120

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vColor;
varying vec4 vShadowCoord;

uniform vec3 uLightDir; // normalized direction from light towards scene
uniform vec3 uViewPos;
uniform float uShininess;
uniform sampler2D uShadowMap;
uniform vec2 uShadowTexelSize; // 1.0 / shadow map size
uniform float uAmbientStrength; // 0..1
uniform float uSpecularStrength; // 0..1
uniform vec3 uSkyColor;     // for hemisphere ambient
uniform vec3 uGroundColor;  // for hemisphere ambient
uniform float uLightSizeUV; // light size in UV units (e.g., pixels * texelSize)
uniform float uPenumbraScale; // scales PCSS penumbra radius
uniform float uMaxShadowLighten; // 0..1, how much to lighten very soft shadows

// 32-sample Poisson disk (normalized)
const int POISSON_COUNT = 32;
const vec2 POISSON[32] = vec2[](
  vec2(-0.94201624, -0.39906216), vec2(0.94558609, -0.76890725),
  vec2(-0.09418410, -0.92938870), vec2(0.34495938, 0.29387760),
  vec2(-0.91588581, 0.45771432), vec2(-0.81544232, -0.87912464),
  vec2(-0.38277543, 0.27676845), vec2(0.97484398, 0.75648379),
  vec2(0.44323325, -0.97511554), vec2(0.53742981, -0.47373420),
  vec2(-0.26496911, -0.41893023), vec2(0.79197514, 0.19090188),
  vec2(-0.24188840, 0.99706507), vec2(-0.81409955, 0.91437590),
  vec2(0.19984126, 0.78641367), vec2(0.14383161, -0.14100790),
  vec2(-0.566, 0.123), vec2(0.112, -0.553), vec2(0.233, 0.912), vec2(-0.112, 0.553),
  vec2(0.689, -0.221), vec2(-0.723, -0.245), vec2(0.321, 0.445), vec2(-0.455, 0.332),
  vec2(0.122, -0.122), vec2(-0.222, -0.789), vec2(0.812, 0.112), vec2(-0.612, 0.712),
  vec2(0.312, -0.712), vec2(0.712, 0.512), vec2(-0.512, -0.112), vec2(0.052, 0.252)
);

float rand(vec2 co){
  return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

mat2 rot2(float a){
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

// Return (sumDepth, count) of blockers in a small region around uv
vec2 blockerSearch(vec2 uv, float receiverDepth, float bias, float searchRadius){
  float sum = 0.0;
  float cnt = 0.0;
  // Poisson-disk search area with per-fragment rotation
  float angle = 6.2831853 * rand(uv * 173.3 + receiverDepth);
  mat2 R = rot2(angle);
  for (int k = 0; k < POISSON_COUNT; ++k){
    vec2 st = uv + (R * POISSON[k]) * (searchRadius * uShadowTexelSize);
    if (st.x < 0.0 || st.x > 1.0 || st.y < 0.0 || st.y > 1.0) continue;
    float d = texture2D(uShadowMap, st).r;
    if (d + bias < receiverDepth){
      sum += d;
      cnt += 1.0;
    }
  }
  return vec2(sum, cnt);
}

float pcfFilter(vec2 uv, float receiverDepth, float bias, float radius){
  float sum = 0.0;
  float angle = 6.2831853 * rand(uv * 93.7 + receiverDepth * 1.37);
  mat2 R = rot2(angle);
  for (int k = 0; k < POISSON_COUNT; ++k){
    vec2 offs = (R * POISSON[k]);
    vec2 st = uv + offs * (radius * uShadowTexelSize);
    if (st.x < 0.0 || st.x > 1.0 || st.y < 0.0 || st.y > 1.0){
      sum += 1.0;
    } else {
      float occ = texture2D(uShadowMap, st).r;
  // Soft comparison for smoother falloff around edges
  float diff = (receiverDepth - bias) - occ;
  // softness scales with sampling radius and offset length
  float softness = 0.75 * radius * length(offs) * max(uShadowTexelSize.x, uShadowTexelSize.y);
  // Invert result so occluded (diff>0) contributes less light
  sum += 1.0 - smoothstep(-softness, softness, diff);
    }
  }
  return sum / float(POISSON_COUNT);
}

void main(){
  vec3 N = normalize(vNormal);
  // For directional light, L is the opposite of uLightDir (pointing from surface to light)
  vec3 L = normalize(-uLightDir);
  vec3 V = normalize(uViewPos - vPosition);
  vec3 H = normalize(L + V);
  float diff = max(dot(N,L), 0.0);
  float spec = pow(max(dot(N,H), 0.0), uShininess);
  // Project to shadow map space
  vec3 proj = vShadowCoord.xyz / vShadowCoord.w;
  vec2 uv = proj.xy * 0.5 + 0.5;
  float depth = clamp(proj.z * 0.5 + 0.5, 0.0, 1.0);
  // Slope-scaled bias helps reduce acne
  // Receiver-plane depth bias: scales with slope and depth
  float ndotl = max(dot(N, L), 0.0);
  float bias = max(0.0008 * (1.0 - ndotl) * depth, 0.00015);
  // PCSS: blocker search then PCF with contact-hardening radius
  float searchRadius = max(1.5, 6.0 * depth); // search region grows with depth
  vec2 bc = blockerSearch(uv, depth, bias, searchRadius);
  float sh;
  float separation = 0.0;
  if (bc.y < 1.0){
    // No blockers in search region -> fully lit
    sh = 1.0;
  } else {
    float avgBlocker = bc.x / bc.y;
    float penumbra = clamp((depth - avgBlocker) / max(avgBlocker, 1e-5), 0.0, 1.0);
    separation = max(depth - avgBlocker, 0.0);
    float radius = max(1.0, uLightSizeUV * penumbra * uPenumbraScale); // scale into texel units
    sh = pcfFilter(uv, depth, bias, radius);
  }
  // For very soft shadows (large separation), reduce shadow darkness a bit (e.g., clouds)
  float soft01 = smoothstep(0.02, 0.25, separation);
  sh = mix(sh, 1.0, uMaxShadowLighten * soft01);
  // Hemisphere ambient lighting for a more natural look
  float hemi = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 hemiAmbient = mix(uGroundColor, uSkyColor, hemi);
  vec3 ambient = uAmbientStrength * hemiAmbient * vColor;
  vec3 diffuse = sh * diff * vColor;
  vec3 specular = sh * (uSpecularStrength * spec) * vec3(1.0);
  gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}