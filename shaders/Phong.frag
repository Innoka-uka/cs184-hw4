#version 330

uniform vec4 u_color;
uniform vec3 u_cam_pos;
uniform vec3 u_light_pos;
uniform vec3 u_light_intensity;

in vec4 v_position;
in vec4 v_normal;
in vec2 v_uv;

out vec4 out_color;

void main() {
  // Blinn-Phong shading
  vec3 n = normalize(v_normal.xyz);
  vec3 l = normalize(u_light_pos - v_position.xyz);
  vec3 v = normalize(u_cam_pos - v_position.xyz);
  vec3 h = normalize(l + v);  // Half vector

  vec3 r = v_position.xyz - u_light_pos;
  float r2 = dot(r, r);

  // Coefficients
  vec3 ka = vec3(0.1);  // Ambient coefficient
  vec3 kd = vec3(1.0);  // Diffuse coefficient
  vec3 ks = vec3(0.5);  // Specular coefficient
  vec3 Ia = vec3(0.3); // Ambient light intensity
  float p = 32.0;       // Shininess exponent

  // Ambient: ka * Ia
  vec3 La = ka * Ia;

  // Diffuse: kd * (I / r^2) * max(0, n . l)
  vec3 Ld = kd * (u_light_intensity / r2) * max(0.0, dot(n, l));

  // Specular: ks * (I / r^2) * max(0, n . h)^p
  vec3 Ls = ks * (u_light_intensity / r2) * pow(max(0.0, dot(n, h)), p);

  // Total lighting
  // out_color = vec4(La, 1);  
  // out_color = vec4(Ld, 1);
  // out_color = vec4(Ls, 1);
  out_color = vec4(La + Ld + Ls, 1);
}

