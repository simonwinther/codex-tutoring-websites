export type Vec = [number, number];
export const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Vec, s: number): Vec => [a[0] * s, a[1] * s];
export const norm = (a: Vec) => Math.hypot(...a);
export const interpolate = (x: Vec, e: Vec, t: number) =>
  add(mul(x, 1 - t), mul(e, t));
export function rng(seed = 42) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let b = Math.imul(a ^ (a >>> 15), 1 | a);
    b = (b + Math.imul(b ^ (b >>> 7), 61 | b)) ^ b;
    return ((b ^ (b >>> 14)) >>> 0) / 4294967296;
  };
}
export function gaussian(random: () => number) {
  return (
    Math.sqrt(-2 * Math.log(Math.max(random(), 1e-12))) *
    Math.cos(2 * Math.PI * random())
  );
}
export const centers: Vec[] = [
  [-1.5, -0.8],
  [1.45, -0.8],
  [0, 1.5],
];
export const sigma = 0.22;
export function mixtureVelocity(z: Vec, t: number): Vec {
  const a = 1 - t,
    s2 = a * a * sigma * sigma + t * t,
    c = t - a * sigma * sigma;
  const logs = centers.map((m) => -(norm(sub(z, mul(m, a))) ** 2) / (2 * s2));
  const top = Math.max(...logs),
    weights = logs.map((l) => Math.exp(l - top)),
    total = weights.reduce((a, b) => a + b, 0);
  return centers.reduce<Vec>(
    (v, m, i) =>
      add(
        v,
        mul(
          add(mul(m, -1), mul(sub(z, mul(m, a)), c / s2)),
          weights[i] / total,
        ),
      ),
    [0, 0],
  );
}
export type Field = (z: Vec, t: number) => Vec;
export function integrate(
  field: Field,
  start: Vec,
  from = 1,
  to = 0,
  steps = 128,
  method: "rk4" | "euler" = "rk4",
): Vec[] {
  let z: Vec = [...start];
  const points: Vec[] = [z],
    h = (to - from) / steps;
  for (let i = 0; i < steps; i++) {
    const t = from + i * h,
      k1 = field(z, t);
    if (method === "euler") z = add(z, mul(k1, h));
    else {
      const k2 = field(add(z, mul(k1, h / 2)), t + h / 2),
        k3 = field(add(z, mul(k2, h / 2)), t + h / 2),
        k4 = field(add(z, mul(k3, h)), t + h);
      z = add(z, mul(add(add(k1, mul(k2, 2)), add(mul(k3, 2), k4)), h / 6));
    }
    points.push(z);
  }
  return points;
}
export const rotationRate = 1.8;
export const rotation = (z: Vec, angle: number): Vec => [
  Math.cos(angle) * z[0] - Math.sin(angle) * z[1],
  Math.sin(angle) * z[0] + Math.cos(angle) * z[1],
];
export const rotateVelocity = (z: Vec): Vec => [
  -rotationRate * z[1],
  rotationRate * z[0],
];
export const rotatePosition = (t: number) =>
  rotation([1.5, 0], rotationRate * t);
export function rotateAverage(z: Vec, r: number, t: number): Vec {
  const d = t - r;
  return Math.abs(d) < 1e-8
    ? rotateVelocity(z)
    : mul(sub(z, rotation(z, -rotationRate * d)), 1 / d);
}
export function rotateJvp(z: Vec, r: number, t: number): Vec {
  const d = t - r;
  if (Math.abs(d) < 1e-6) return mul(z, (-rotationRate * rotationRate) / 2);
  return mul(sub(rotateVelocity(z), rotateAverage(z, r, t)), 1 / d);
}
export type Params = [number, number, number, number]; // scalar affine u=a*z+b*r+c*t+d
export const initialParams: Params = [0.3, -0.2, 0.1, 0.05];
export const affine = (p: Params, z: number, r: number, t: number) =>
  p[0] * z + p[1] * r + p[2] * t + p[3];
export const affineJvp = (p: Params, v: number) => p[0] * v + p[2];
export const lossWeight = (error: number, p = 1, c = 0.001) =>
  1 / Math.pow(error * error + c, p);
export function trainingStep(
  p: Params,
  x: number,
  e: number,
  r: number,
  t: number,
  lr = 0.04,
  velocity = e - x,
  power = 0,
) {
  const z = (1 - t) * x + t * e,
    u = affine(p, z, r, t),
    jvp = affineJvp(p, velocity),
    target = velocity - (t - r) * jvp,
    error = u - target,
    weight = lossWeight(error, power);
  const gradient: Params = [z, r, t, 1].map(
    (q) => 2 * weight * error * q,
  ) as Params;
  const next = p.map((q, i) => q - lr * gradient[i]) as Params;
  return {
    z,
    velocity,
    u,
    jvp,
    target,
    error,
    weight,
    loss: weight * error * error,
    gradient,
    next,
    lossAfterFrozen: weight * (affine(next, z, r, t) - target) ** 2,
  };
}
export const guidedVelocity = (
  v: number,
  uncond: number,
  cond: number,
  omega: number,
  kappa = 0,
) => omega * v + kappa * cond + (1 - omega - kappa) * uncond;
export const effectiveGuidance = (omega: number, kappa: number) =>
  omega / (1 - kappa);
export function sampleTimes(
  seed: number,
  count: number,
  kind: "uniform" | "logit",
  mu = -0.4,
  sd = 1,
  offDiagonal = 0.25,
) {
  const random = rng(seed);
  return Array.from({ length: count }, () => {
    const sample = () =>
      kind === "uniform"
        ? random()
        : 1 / (1 + Math.exp(-(mu + sd * gaussian(random))));
    let r = sample(),
      t = sample();
    if (r > t) [r, t] = [t, r];
    if (random() > offDiagonal) r = t;
    return { r, t };
  });
}
