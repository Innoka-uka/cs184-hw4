#version 330


uniform vec3 u_cam_pos;

uniform samplerCube u_texture_cubemap;

in vec4 v_position;
in vec4 v_normal;
in vec4 v_tangent;

out vec4 out_color;

void main() {
  // Compute outgoing eye ray direction (from camera to fragment)
  vec3 wo = normalize(v_position.xyz - u_cam_pos);

  // Get surface normal
  vec3 n = normalize(v_normal.xyz);

  // Reflect eye ray across surface normal
  vec3 wi = reflect(wo, n);

  // Sample environment map in the reflected direction
  out_color = texture(u_texture_cubemap, wi);
}
