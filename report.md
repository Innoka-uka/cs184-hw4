# Collision Handling Implementation

## Handling Collisions with Spheres and Planes

### Sphere Collision

For sphere collision detection, I implemented the `Sphere::collide` method which handles point masses that intersect with or penetrate into a sphere. The algorithm first computes the distance from the point mass to the sphere's origin. If this distance is less than or equal to the sphere's radius, the point mass is inside or intersecting the sphere. In this case, I calculate the tangent point on the sphere's surface by extending a ray from the sphere's origin through the point mass's current position until it reaches the sphere's surface. The correction vector is then computed as the difference between this tangent point and the point mass's last position. Finally, the point mass's new position is set to last position plus the correction scaled by a friction factor (1 - friction), which reduces the velocity component perpendicular to the collision surface to simulate friction.

### Plane Collision

For plane collision detection, I implemented the `Plane::collide` method which handles point masses that cross through a plane from one side to the other. The algorithm determines whether a crossing occurred by computing the signed distances from both the last position and current position to the plane (using the dot product with the plane's normal). If the last position was on or above the plane (distance >= 0) while the current position is below (distance < 0), a crossing is detected. To find where the crossing occurred, I use linear interpolation between the two positions based on their relative distances to the plane. The tangent point is then offset slightly in the direction of the plane's normal by a small SURFACE_OFFSET constant (0.0001) to ensure the point mass remains just above the surface. The correction vector is applied to the last position and scaled by the friction factor.

In the main simulation loop, both collision types are handled by iterating through all collision objects and all point masses, calling the appropriate `collide` method for each pair.

---

## Handling Self-Collisions

Self-collision detection is implemented using spatial hashing to achieve O(n) average time complexity instead of the naive O(n²) approach. The implementation consists of three key components.

### Spatial Hash Function

The `hash_position` method partitions 3D space into uniform boxes with dimensions determined by the cloth's geometry. Each box has width equal to three times the cloth width divided by the number of width points, and height equal to three times the cloth height divided by the number of height points. The depth is set to the maximum of width and height. A position is mapped to a box by truncating its coordinates to the nearest box origin using floor division. The resulting coordinates are combined into a single float value that serves as the hash key.

### Building the Spatial Map

The `build_spatial_map` method constructs a hash table that maps each box identifier to a vector of pointers to all point masses contained within that box. Before rebuilding, the method properly deallocates any previously allocated memory to prevent leaks. Each point mass is processed by computing its hash key and inserting a pointer to itself into the corresponding bucket in the map.

### Collision Resolution

The `self_collide` method handles collision response for a single point mass by looking up all other point masses in the same spatial bucket. For each candidate, if the distance between the point mass and the candidate is less than twice the cloth thickness, a repulsive correction is computed. The correction direction points from the candidate toward the point mass, with magnitude equal to the amount by which the distance falls below the minimum separation distance. All such corrections are accumulated and averaged, then divided by the number of simulation steps to reduce the severity of each individual correction, improving numerical stability.

The self-collision handling is called from the main simulation loop after building the spatial map, ensuring that all point masses have an opportunity to interact with their nearby neighbors in each time step.

---

## Custom Shader Implementation

I created a custom shader that combines all 5 shader techniques (Texture, Bump, Displacement, Diffuse, Phong) with procedural animations.

### Custom.vert (Vertex Shader)

**Displacement Mapping**: The vertex shader displaces vertices along their normals based on a height texture. I sample the height at the current UV position and neighboring positions to compute partial derivatives (dU, dV), which are used to calculate the displaced normal in tangent space.

**Procedural Wave Animation**: Added a time-based sinusoidal wave animation that creates a rippling effect on the cloth surface, independent of the mesh geometry.

### Custom.frag (Fragment Shader)

**Texture Mapping**: Blends texture_1 and texture_2 based on a time-varying factor, creating a dynamic transition between two textures. Additionally overlays a procedural checkerboard pattern.

**Bump Mapping**: Computes surface normals from the height texture using finite differences. The TBN (Tangent-Bitangent-Normal) matrix transforms local bump normals to world space for accurate lighting.

**Blinn-Phong Lighting**:
- **Ambient**: Time-animated rainbow colors with position-based variation
- **Diffuse**: Texture-driven diffuse color modulated by displaced surface normal
- **Specular**: Blue-tinted highlights with shininess exponent of 64

**Additional Effects**:
- **Rim Lighting**: Edge highlighting based on view angle, creating a glow effect at silhouette edges
- **Emission**: Subtle pulsing glow based on texture color and time
- **Gamma Correction**: Applied at the end for proper color output

### Uniforms Used

- `u_time` (float): Elapsed time for animation
- `u_texture_1`, `u_texture_2`, `u_texture_3`: Texture samplers
- `u_texture_2_size`: Height map dimensions for bump/displacement calculations
- `u_height_scaling`, `u_normal_scaling`: Controllable via GUI sliders

### Key Differences from Individual Shaders

Unlike the individual shader implementations, the Custom shader:
1. Combines texture blending with procedural patterns
2. Applies both displacement (vertex) and bump (fragment) mapping simultaneously
3. Adds time-based animation to all visual effects
4. Uses rainbow-colored ambient lighting instead of static colors
5. Includes rim lighting for enhanced visual depth
