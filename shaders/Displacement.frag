#version 330

uniform vec3 u_cam_pos;
uniform vec3 u_light_pos;
uniform vec3 u_light_intensity;

uniform vec4 u_color;

uniform sampler2D u_texture_2;
uniform vec2 u_texture_2_size;

uniform float u_normal_scaling;
uniform float u_height_scaling;

in vec4 v_position;
in vec4 v_normal;
in vec4 v_tangent;
in vec2 v_uv;

out vec4 out_color;

float h(vec2 uv) {
  // Sample height from texture's red channel
  return texture(u_texture_2, uv).r;
}

void main() {
  // Get original surface normal and tangent
  vec3 n = normalize(v_normal.xyz);
  vec3 t = normalize(v_tangent.xyz);
  vec3 b = cross(n, t);  // Bitangent

  // TBN matrix to transform from local object space to model space
  mat3 TBN = mat3(t, b, n);

  // Sample heights at current UV and neighboring UVs
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

  // Local space normal (pointing outward from bump surface)
  vec3 n_local = vec3(-dU, -dV, 1.0);

  // Transform to world space using TBN matrix
  vec3 n_displaced = normalize(TBN * n_local);

  // Use displaced normal for Blinn-Phong shading
  vec3 l = normalize(u_light_pos - v_position.xyz);
  vec3 v_dir = normalize(u_cam_pos - v_position.xyz);
  vec3 h_vec = normalize(l + v_dir);

  vec3 r = v_position.xyz - u_light_pos;
  float r2 = dot(r, r);

  // Material coefficients
  vec3 ka = vec3(0.1);
  vec3 kd = vec3(1.0);
  vec3 ks = vec3(0.5);
  vec3 Ia = vec3(0.3);
  float p = 32.0;

  // Ambient
  vec3 La = ka * Ia;

  // Diffuse with displaced normal
  vec3 Ld = kd * (u_light_intensity / r2) * max(0.0, dot(n_displaced, l));

  // Specular with displaced normal
  vec3 Ls = ks * (u_light_intensity / r2) * pow(max(0.0, dot(n_displaced, h_vec)), p);

  out_color = vec4(La + Ld + Ls, 1);
}

