#include "iostream"
#include <nanogui/nanogui.h>

#include "../clothMesh.h"
#include "../clothSimulator.h"
#include "plane.h"

using namespace std;
using namespace CGL;

#define SURFACE_OFFSET 0.0001

void Plane::collide(PointMass &pm) {
  // Check if the point mass crossed the plane
  // by checking if it's on opposite sides of the plane in last_position and position

  double last_dist = dot(pm.last_position - point, normal);
  double curr_dist = dot(pm.position - point, normal);

  // If last position was above (or on) the plane and current position is below
  if (last_dist >= 0 && curr_dist < 0) {
    // Point mass crossed from above to below - need to bump it back up

    // Calculate the tangent point where the line crosses the plane
    // Using linear interpolation between last_position and position
    double t = last_dist / (last_dist - curr_dist);
    Vector3D tangent_point = pm.last_position + t * (pm.position - pm.last_position);

    // Move tangent point slightly above the plane surface
    Vector3D above_tangent = tangent_point + normal * SURFACE_OFFSET;

    // Calculate correction vector
    Vector3D correction = above_tangent - pm.last_position;

    // Apply correction scaled by friction: (1 - friction)
    pm.position = pm.last_position + correction * (1.0 - friction);
  }
  // If last position was below and current is above, no correction needed
  // (point is moving away from the plane)
}

void Plane::render(GLShader &shader) {
  nanogui::Color color(0.7f, 0.7f, 0.7f, 1.0f);

  Vector3f sPoint(point.x, point.y, point.z);
  Vector3f sNormal(normal.x, normal.y, normal.z);
  Vector3f sParallel(normal.y - normal.z, normal.z - normal.x,
                     normal.x - normal.y);
  sParallel.normalize();
  Vector3f sCross = sNormal.cross(sParallel);

  MatrixXf positions(3, 4);
  MatrixXf normals(3, 4);

  positions.col(0) << sPoint + 2 * (sCross + sParallel);
  positions.col(1) << sPoint + 2 * (sCross - sParallel);
  positions.col(2) << sPoint + 2 * (-sCross + sParallel);
  positions.col(3) << sPoint + 2 * (-sCross - sParallel);

  normals.col(0) << sNormal;
  normals.col(1) << sNormal;
  normals.col(2) << sNormal;
  normals.col(3) << sNormal;

  if (shader.uniform("u_color", false) != -1) {
    shader.setUniform("u_color", color);
  }
  shader.uploadAttrib("in_position", positions);
  if (shader.attrib("in_normal", false) != -1) {
    shader.uploadAttrib("in_normal", normals);
  }

  shader.drawArray(GL_TRIANGLE_STRIP, 0, 4);
}
