import { it, expect } from "vitest";
import katex from "katex";
import { chapters, equations, glossary } from "../src/data/paper";
import { coverage } from "../src/data/coverage";
import {
  experiments,
  configRows,
  models,
  scaling,
} from "../src/data/experiments";
import { existsSync, readdirSync } from "node:fs";
it("covers all numbered material and all 23 source pages", () => {
  expect(equations.map((e) => e.id)).toEqual(
    Array.from({ length: 24 }, (_, i) => i + 1),
  );
  for (const [kind, count] of [
    ["equation", 24],
    ["algorithm", 2],
    ["figure", 5],
    ["table", 5],
  ] as const)
    expect(coverage.filter((c) => c.kind === kind)).toHaveLength(count);
  expect(new Set(coverage.flatMap((c) => c.pages)).size).toBe(23);
  for (const ref of coverage)
    expect(chapters.some((c) => c.id === ref.chapter)).toBe(true);
});
it("renders every equation without a KaTeX parse error", () => {
  for (const eq of equations)
    expect(() =>
      katex.renderToString(eq.tex, { throwOnError: true, strict: "ignore" }),
    ).not.toThrow();
});
it("preserves the measured result configurations and table completeness", () => {
  expect(experiments.filter((e) => e.table === "1")).toHaveLength(27);
  expect(experiments.filter((e) => e.table === "2")).toHaveLength(23);
  expect(experiments.filter((e) => e.table === "3")).toHaveLength(5);
  expect(experiments.filter((e) => e.table === "5")).toHaveLength(5);
  expect(configRows).toHaveLength(24);
  expect(models).toHaveLength(6);
  expect(models.find((m) => m.name === "XL/2+")?.epochs).toBe(1000);
  expect(
    experiments.find((e) => e.setting === "MeanFlow-XL/2" && e.nfe === "1")
      ?.fid,
  ).toBe(3.43);
  expect(
    experiments.find((e) => e.setting === "MeanFlow-XL/2" && e.nfe === "2")
      ?.fid,
  ).toBe(2.93);
  expect(experiments.find((e) => e.setting === "MeanFlow-XL/2+")?.fid).toBe(
    2.2,
  );
  expect(experiments.find((e) => e.setting === "SiT-XL/2")?.fid).toBe(2.06);
  expect(scaling.filter((p) => !p.approximate)).toHaveLength(4);
  expect(
    scaling.some((p) => p.x === 40 && ["B/2", "M/2"].includes(p.group)),
  ).toBe(false);
});
it("provides the original PDF, all extracted samples and glossary destinations", () => {
  expect(existsSync("public/paper/mean-flows.pdf")).toBe(true);
  expect(
    readdirSync("public/samples").filter((f) => f.endsWith(".png")),
  ).toHaveLength(24);
  for (const g of glossary)
    expect(chapters.some((c) => c.id === g.chapter)).toBe(true);
});
