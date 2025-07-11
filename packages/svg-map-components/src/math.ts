/*
We have a somewhat different implementation of quaternions than
the plate rotation code
From http://bl.ocks.org/ivyywang/7c94cb5a3accd9913263
*/

var to_radians = Math.PI / 180;
var to_degrees = 180 / Math.PI;

// Helper function: cross product of two vectors v0&v1
function cross(v0, v1) {
  return [
    v0[1] * v1[2] - v0[2] * v1[1],
    v0[2] * v1[0] - v0[0] * v1[2],
    v0[0] * v1[1] - v0[1] * v1[0],
  ];
}

//Helper function: dot product of two vectors v0&v1
function dot(v0, v1) {
  for (var i = 0, sum = 0; v0.length > i; ++i) sum += v0[i] * v1[i];
  return sum;
}

// Helper function:
// This function converts a [lon, lat] coordinates into a [x,y,z] coordinate
// the [x, y, z] is Cartesian, with origin at lon/lat (0,0) center of the earth
function sph2cart(coord) {
  var lon = coord[0] * to_radians;
  var lat = coord[1] * to_radians;

  var x = Math.cos(lat) * Math.cos(lon);

  var y = Math.cos(lat) * Math.sin(lon);

  var z = Math.sin(lat);

  return [x, y, z];
}

// Helper function:
// This function computes a quaternion representation for the rotation between to vectors
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function quaternion(v0, v1) {
  if (v0 && v1) {
    var w = cross(v0, v1), // vector pendicular to v0 & v1
      w_len = Math.sqrt(dot(w, w)); // length of w

    if (w_len == 0) return;

    var theta = 0.5 * Math.acos(Math.max(-1, Math.min(1, dot(v0, v1)))),
      qi = (w[2] * Math.sin(theta)) / w_len,
      qj = (-w[1] * Math.sin(theta)) / w_len,
      qk = (w[0] * Math.sin(theta)) / w_len,
      qr = Math.cos(theta);

    return theta && [qr, qi, qj, qk];
  }
}

// Helper function:
// This functions converts euler angles to quaternion
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function euler2quat(e) {
  if (!e) return;

  var roll = 0.5 * e[0] * to_radians,
    pitch = 0.5 * e[1] * to_radians,
    yaw = 0.5 * e[2] * to_radians,
    sr = Math.sin(roll),
    cr = Math.cos(roll),
    sp = Math.sin(pitch),
    cp = Math.cos(pitch),
    sy = Math.sin(yaw),
    cy = Math.cos(yaw),
    qi = sr * cp * cy - cr * sp * sy,
    qj = cr * sp * cy + sr * cp * sy,
    qk = cr * cp * sy - sr * sp * cy,
    qr = cr * cp * cy + sr * sp * sy;

  return [qr, qi, qj, qk];
}

// This functions computes a quaternion multiply
// Geometrically, it means combining two quant rotations
// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/arithmetic/index.htm
function quatMultiply(q1, q2) {
  if (!q1 || !q2) return;

  var a = q1[0],
    b = q1[1],
    c = q1[2],
    d = q1[3],
    e = q2[0],
    f = q2[1],
    g = q2[2],
    h = q2[3];

  return [
    a * e - b * f - c * g - d * h,
    b * e + a * f + c * h - d * g,
    a * g - b * h + c * e + d * f,
    a * h + b * g - c * f + d * e,
  ];
}

// This function computes quaternion to euler angles
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function quat2euler(t) {
  if (!t) return;

  return [
    Math.atan2(
      2 * (t[0] * t[1] + t[2] * t[3]),
      1 - 2 * (t[1] * t[1] + t[2] * t[2]),
    ) * to_degrees,
    Math.asin(Math.max(-1, Math.min(1, 2 * (t[0] * t[2] - t[3] * t[1])))) *
      to_degrees,
    Math.atan2(
      2 * (t[0] * t[3] + t[1] * t[2]),
      1 - 2 * (t[2] * t[2] + t[3] * t[3]),
    ) * to_degrees,
  ];
}

/*  This function computes the euler angles when given two vectors, and a rotation
	This is really the only math function called with d3 code.

	v0 - starting pos in lon/lat, commonly obtained by projection.invert
	v1 - ending pos in lon/lat, commonly obtained by projection.invert
	o0 - the projection rotation in euler angles at starting pos (v0), commonly obtained by projection.rotate
*/

export { euler2quat, quat2euler, sph2cart, quaternion, quatMultiply };
