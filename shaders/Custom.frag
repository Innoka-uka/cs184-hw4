#version 330

// ============ UNIFORMS ============
// Matrix uniforms
uniform mat4 u_view_projection;
uniform mat4 u_model;

// Displacement mapping uniforms
uniform sampler2D u_texture_2;
uniform float u_normal_scaling;
uniform float u_height_scaling;
uniform vec2 u_texture_2_size;

// Lighting uniforms
uniform vec3 u_cam_pos;
uniform vec3 u_light_pos;
uniform vec3 u_light_intensity;

// Texture uniforms
uniform sampler2D u_texture_1;
// u_texture_2 is already declared above for displacement
uniform sampler2D u_texture_3;
uniform sampler2D u_texture_4;

// Time uniform for animation
uniform float u_time;

// ============ INPUT FROM VERTEX SHADER ============
in vec4 v_position;
in vec4 v_normal;
in vec4 v_tangent;
in vec2 v_uv;

// ============ OUTPUT ============
out vec4 out_color;

// ============ HELPER FUNCTIONS ============

// Sample height from displacement texture
float h(vec2 uv) {
  return texture(u_texture_2, uv).r;
}

// Procedural checkerboard pattern
vec3 checkerboard(vec2 uv, float scale) {
  vec2 grid = floor(uv * scale);
  float pattern = mod(grid.x + grid.y, 2.0);
  return mix(vec3(0.2, 0.2, 0.3), vec3(0.8, 0.8, 0.9), pattern);
}

// Procedural noise function
float noise(vec2 uv) {
  return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
}

// Rainbow color based on position and time
vec3 rainbow(float t) {
  vec3 c = 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
  return c;
}

// ============ MAIN ============
void main() {
  // Normalize vectors
  vec3 n = normalize(v_normal.xyz);
  vec3 t = normalize(v_tangent.xyz);
  vec3 b = cross(n, t);
  mat3 TBN = mat3(t, b, n);

  // Light direction and view direction
  vec3 l = normalize(u_light_pos - v_position.xyz);
  vec3 v_dir = normalize(u_cam_pos - v_position.xyz);
  vec3 h_vec = normalize(l + v_dir);

  // Light attenuation
  vec3 r = v_position.xyz - u_light_pos;
  float r2 = dot(r, r);

  // ============ TEXTURE MAPPING ============
  // Sample all textures
  vec4 tex1 = texture(u_texture_1, v_uv);
  vec4 tex2 = texture(u_texture_2, v_uv);
  vec4 tex3 = texture(u_texture_3, v_uv);

  // Blend textures based on UV coordinates and time
  float blend_factor = 0.5 + 0.5 * sin(u_time * 0.5);
  vec3 texture_color = mix(tex1.rgb, tex2.rgb, blend_factor);

  // Add procedural checkerboard overlay
  vec3 checker = checkerboard(v_uv, 10.0);
  texture_color = mix(texture_color, checker, 0.2);

  // ============ BUMP MAPPING ============
  // Sample heights for bump normal calculation
  float u = v_uv.x;
  float v = v_uv.y;
  float w = u_texture_2_size.x;
  float h_size = u_texture_2_size.y;

  float h_current = h(v_uv);
  float h_u = h(vec2(u + 1.0/w, v));
  float h_v = h(vec2(u, v + 1.0/h_size));

  // Compute partial derivatives of height
  float dU = (h_u - h_current) * u_height_scaling * u_normal_scaling;
  float dV = (h_v - h_current) * u_height_scaling * u_normal_scaling;

  // Bump/displaced normal in local space
  vec3 n_bump = vec3(-dU, -dV, 1.0);
  vec3 n_displaced = normalize(TBN * n_bump);

  // ============ DIFFUSE LIGHTING ============
  vec3 kd = texture_color;  // Use texture as diffuse color
  vec3 Ld = kd * (u_light_intensity / r2) * max(0.0, dot(n_displaced, l));

  // ============ SPECULAR LIGHTING ============
  vec3 ks = vec3(0.6, 0.7, 0.8);  // Slight blue-tinted specular
  float p = 64.0;
  vec3 Ls = ks * (u_light_intensity / r2) * pow(max(0.0, dot(n_displaced, h_vec)), p);

  // ============ AMBIENT LIGHTING ============
  // Animated ambient color (rainbow effect)
  float ambient_time = u_time * 0.3 + (v_position.x + v_position.y) * 0.5;
  vec3 ka = 0.15 + 0.1 * rainbow(ambient_time);
  vec3 Ia = vec3(0.3, 0.35, 0.4);
  vec3 La = ka * Ia;

  // ============ COMBINE ALL COMPONENTS ============
  vec3 final_color = La + Ld + Ls;

  // Add rim lighting effect
  float rim = 1.0 - max(0.0, dot(v_dir, n));
  rim = pow(rim, 3.0);
  vec3 rim_color = rainbow(u_time * 0.2) * rim * 0.3;
  final_color += rim_color;

  // Add subtle emission glow
  vec3 emission = texture_color * 0.1 * (1.0 + 0.5 * sin(u_time * 2.0));
  final_color += emission;

  // Gamma correction
  final_color = pow(final_color, vec3(1.0/2.2));

  out_color = vec4(final_color, 1.0);
}
