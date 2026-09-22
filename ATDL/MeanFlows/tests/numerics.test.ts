import { describe, it, expect } from "vitest";
import {
  add,
  affine,
  affineJvp,
  centers,
  effectiveGuidance,
  gaussian,
  guidedVelocity,
  initialParams,
  integrate,
  interpolate,
  lossWeight,
  mixtureVelocity,
  mul,
  norm,
  rng,
  rotateAverage,
  rotateJvp,
  rotatePosition,
  rotateVelocity,
  rotation,
  rotationRate,
  sampleTimes,
  sigma,
  sub,
  trainingStep,
  type Vec,
} from "../src/math/flow";
const close = (a: Vec, b: Vec, tol = 1e-8) =>
  expect(norm(sub(a, b))).toBeLessThan(tol);
describe("Interpolation and marginal velocity", () => {
  it("has the correct data/noise endpoints and conditional derivative", () => {
    const x: Vec = [1, 2],
      e: Vec = [-2, 0.5],
      t = 0.3,
      h = 1e-5;
    close(interpolate(x, e, 0), x);
    close(interpolate(x, e, 1), e);
    close(
      mul(sub(interpolate(x, e, t + h), interpolate(x, e, t - h)), 1 / (2 * h)),
      sub(e, x),
    );
  });
  it("reduces to analytic endpoint conditional means", () => {
    const z: Vec = [0.6, -0.8],
      mean = mul(
        centers.reduce((a, b) => add(a, b), [0, 0]),
        1 / 3,
      );
    close(mixtureVelocity(z, 1), sub(z, mean));
    close(mixtureVelocity(z, 0), mul(z, -1));
  });
  it("matches an independent Monte Carlo conditional calculation", () => {
    const random = rng(123),
      z: Vec = [0.2, 0.55],
      t = 0.47;
    let denominator = 0,
      numerator: Vec = [0, 0];
    for (let i = 0; i < 160000; i++) {
      const c = centers[Math.floor(random() * 3)],
        x: Vec = [
          c[0] + sigma * gaussian(random),
          c[1] + sigma * gaussian(random),
        ];
      const epsilon = mul(sub(z, mul(x, 1 - t)), 1 / t);
      const weight = Math.exp(-(norm(epsilon) ** 2) / 2);
      denominator += weight;
      numerator = add(numerator, mul(sub(epsilon, x), weight));
    }
    close(mixtureVelocity(z, t), mul(numerator, 1 / denominator), 0.014);
  });
  it("uses reverse-time integration and improves Euler accuracy with resolution", () => {
    const start: Vec = [0.55, 1.35],
      reference = integrate(mixtureVelocity, start, 1, 0, 2048).at(-1)!;
    const coarse = integrate(mixtureVelocity, start, 1, 0, 1, "euler").at(-1)!,
      fine = integrate(mixtureVelocity, start, 1, 0, 64, "euler").at(-1)!;
    expect(norm(sub(fine, reference))).toBeLessThan(
      norm(sub(coarse, reference)) / 10,
    );
    close(
      integrate(mixtureVelocity, start, 1, 0, 1024).at(-1)!,
      reference,
      1e-8,
    );
  });
});
describe("Average velocity and identity", () => {
  it.each([
    [0, 1],
    [0.2, 0.8],
    [0.7, 0.70001],
    [0.6, 0.6],
  ])("satisfies sampling, identity and additivity over [%s,%s]", (r, t) => {
    const z = rotatePosition(t),
      u = rotateAverage(z, r, t),
      s = (r + t) / 2,
      zs = rotatePosition(s);
    close(sub(z, mul(u, t - r)), rotatePosition(r));
    close(u, sub(rotateVelocity(z), mul(rotateJvp(z, r, t), t - r)));
    close(
      mul(u, t - r),
      add(
        mul(rotateAverage(zs, r, s), s - r),
        mul(rotateAverage(z, s, t), t - s),
      ),
    );
  });
  it("approaches the instantaneous velocity on the diagonal", () => {
    const z: Vec = [1, -0.5];
    close(rotateAverage(z, 0.5, 0.5), rotateVelocity(z));
    close(rotateAverage(z, 0.5 - 1e-7, 0.5), rotateVelocity(z), 1e-6);
  });
  it("matches total derivative finite differences along (v,0,1)", () => {
    const z: Vec = [0.6, 0.9],
      r = 0.15,
      t = 0.7,
      h = 1e-6;
    const plus = rotateAverage(rotation(z, rotationRate * h), r, t + h),
      minus = rotateAverage(rotation(z, -rotationRate * h), r, t - h);
    close(rotateJvp(z, r, t), mul(sub(plus, minus), 1 / (2 * h)), 1e-7);
  });
  it("also has the right diagonal derivative limit", () => {
    const z: Vec = [0.6, 0.9],
      t = 0.5,
      h = 1e-5;
    const forward = mul(
      sub(
        rotateAverage(rotation(z, rotationRate * h), t, t + h),
        rotateAverage(z, t, t),
      ),
      1 / h,
    );
    close(rotateJvp(z, t, t), forward, 1e-4);
  });
});
describe("Learning and guidance", () => {
  it("computes the JVP and detached gradient independently", () => {
    const result = trainingStep(initialParams, 0.8, -0.6, 0.2, 0.75),
      h = 1e-6;
    expect(result.u).toBeCloseTo(0.01, 12);
    expect(result.jvp).toBeCloseTo(-0.32, 12);
    expect(result.target).toBeCloseTo(-1.224, 12);
    for (let i = 0; i < 4; i++) {
      const plus = [...initialParams] as typeof initialParams,
        minus = [...initialParams] as typeof initialParams;
      plus[i] += h;
      minus[i] -= h;
      const f = (p: typeof initialParams) =>
        (affine(p, result.z, 0.2, 0.75) - result.target) ** 2;
      expect(result.gradient[i]).toBeCloseTo((f(plus) - f(minus)) / (2 * h), 7);
    }
    expect(result.lossAfterFrozen).toBeLessThan(result.loss);
    expect(affineJvp(initialParams, -1.4)).toBeCloseTo(-0.32);
  });
  it("reduces to Flow Matching on the diagonal", () => {
    expect(trainingStep(initialParams, 0.8, -0.6, 0.7, 0.7).target).toBeCloseTo(
      -1.4,
    );
  });
  it("recovers the effective guidance relation at exact fields", () => {
    const conditional = 1.2,
      unconditional = 0.3,
      omega = 0.2,
      kappa = 0.92,
      effective = effectiveGuidance(omega, kappa),
      guided = effective * conditional + (1 - effective) * unconditional;
    expect(
      guidedVelocity(conditional, unconditional, guided, omega, kappa),
    ).toBeCloseTo(guided, 12);
    expect(guidedVelocity(conditional, unconditional, 9, 1, 0)).toBe(
      conditional,
    );
    expect(effective).toBeCloseTo(2.5);
  });
  it("samples ordered times and honors diagonal extremes", () => {
    for (const kind of ["uniform", "logit"] as const) {
      for (const ratio of [0, 0.25, 1]) {
        const points = sampleTimes(10, 1000, kind, -0.4, 1, ratio);
        expect(points.every(({ r, t }) => r >= 0 && t <= 1 && r <= t)).toBe(
          true,
        );
        if (ratio === 0) expect(points.every((p) => p.r === p.t)).toBe(true);
        if (ratio === 1) expect(points.every((p) => p.r < p.t)).toBe(true);
      }
    }
  });
  it("keeps weights and weighted losses finite at zero and tiny errors", () => {
    for (const p of [0, 0.5, 1, 1.5, 2])
      for (const e of [0, 1e-12, 0.5, 100]) {
        expect(Number.isFinite(lossWeight(e, p))).toBe(true);
        expect(Number.isFinite(lossWeight(e, p) * e * e)).toBe(true);
      }
  });
});
