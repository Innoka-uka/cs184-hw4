#include <nanogui/nanogui.h>

#include "../clothMesh.h"
#include "../misc/sphere_drawing.h"
#include "sphere.h"

using namespace nanogui;
using namespace CGL;

void Sphere::collide(PointMass &pm) {
  // Check if point mass is inside or intersecting the sphere
  Vector3D pm_to_origin = pm.position - origin;
  double dist_to_origin = pm_to_origin.norm();

  if (dist_to_origin <= radius) {
    // Calculate tangent point on sphere surface
    // The tangent point is along the direction from origin to point mass
    Vector3D direction = pm_to_origin / dist_to_origin;
    Vector3D tangent_point = origin + direction * radius;

    // Calculate correction vector from last_position to tangent point
    Vector3D correction = tangent_point - pm.last_position;

    // Apply correction scaled by friction: (1 - friction)
    pm.position = pm.last_position + correction * (1.0 - friction);
  }
}

void Sphere::render(GLShader &shader) {
  // We decrease the radius here so flat triangles don't behave strangely
  // and intersect with the sphere when rendered
  m_sphere_mesh.draw_sphere(shader, origin, radius * 0.92);
}
