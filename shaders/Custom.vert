#version 330

// Uniform variables are constant throughout the entire shader
uniform mat4 u_model;
uniform mat4 u_view_projection;
uniform float u_time;           // Time uniform for animation

// In a vertex shader, the "in" variables are read-only per-vertex
// properties.
in vec4 in_position;
in vec4 in_normal;
in vec4 in_tangent;
in vec2 in_uv;

// In a vertex shader, the "out" variables are per-vertex properties
// that are read/write. These properties allow us to communicate
// information from the vertex shader to the fragment shader.
out vec4 v_position;
out vec4 v_normal;
out vec2 v_uv;
out vec4 v_tangent;

// Displacement mapping uniforms
uniform sampler2D u_texture_2;
uniform float u_height_scaling;
uniform float u_normal_scaling;
uniform vec2 u_texture_2_size;

// Sample height from displacement texture
float h(vec2 uv) {
  return texture(u_texture_2, uv).r;
}

void main() {
  // Pass UV to fragment shader
  v_uv = in_uv;

  // --- Displacement Mapping in Vertex Shader ---
  float w = u_texture_2_size.x;
  float h_size = u_texture_2_size.y;
  float u_coord = in_uv.x;
  float v_coord = in_uv.y;

  // Sample height at current position
  float h_current = h(in_uv);

  // Sample neighboring heights for normal calculation
  float h_u = h(vec2(u_coord + 1.0/w, v_coord));
  float h_v = h(vec2(u_coord, v_coord + 1.0/h_size));

  // Compute partial derivatives
  float dU = (h_u - h_current) * u_height_scaling * u_normal_scaling;
  float dV = (h_v - h_current) * u_height_scaling * u_normal_scaling;

  // Get original normal and tangent
  vec3 n = normalize(in_normal.xyz);
  vec3 t = normalize(in_tangent.xyz);
  vec3 b = cross(n, t);  // Bitangent

  // Displace position along normal (procedural wave animation)
  float wave_height = sin(in_position.x * 3.0 + u_time * 2.0) *
                     cos(in_position.y * 3.0 + u_time * 1.5) * 0.1;
  vec3 displaced_pos = in_position.xyz + n * (h_current * u_height_scaling + wave_height);

  // Transform displaced position
  v_position = u_model * vec4(displaced_pos, 1.0);

  // --- Compute displaced normal ---
  vec3 n_local = vec3(-dU, -dV, 1.0);
  mat3 TBN = mat3(t, b, n);
  vec3 n_displaced = normalize(TBN * n_local);

  v_normal = vec4(n_displaced, 0.0);
  v_tangent = normalize(u_model * vec4(t, 0.0));

  // The final screen-space location of this vertex
  gl_Position = u_view_projection * u_model * vec4(displaced_pos, 1.0);
}
