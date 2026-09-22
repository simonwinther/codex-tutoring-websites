export type Experiment = {
  table: string;
  group: string;
  setting: string;
  fid: number;
  nfe: string;
  params: string;
  metadata: string;
  page: number;
};
export const experiments: Experiment[] = [];
const ablations: [string, [string, number][]][] = [
  [
    "1a · Off-diagonal ratio",
    [
      ["0% (= FM)", 328.91],
      ["25%", 61.06],
      ["50%", 63.14],
      ["100%", 67.32],
    ],
  ],
  [
    "1b · JVP tangent",
    [
      ["(v, 0, 1)", 61.06],
      ["(v, 0, 0)", 268.06],
      ["(v, 1, 0)", 329.22],
      ["(v, 1, 1)", 137.96],
    ],
  ],
  [
    "1c · Positional embedding",
    [
      ["(t, r)", 61.75],
      ["(t, t−r)", 61.06],
      ["(t, r, t−r)", 63.98],
      ["t−r only", 63.13],
    ],
  ],
  [
    "1d · Time sampler",
    [
      ["uniform(0, 1)", 65.9],
      ["lognorm(−0.2, 1.0)", 63.83],
      ["lognorm(−0.2, 1.2)", 64.72],
      ["lognorm(−0.4, 1.0)", 61.06],
      ["lognorm(−0.4, 1.2)", 61.79],
    ],
  ],
  [
    "1e · Loss power p",
    [
      ["0.0", 79.75],
      ["0.5", 63.98],
      ["1.0", 61.06],
      ["1.5", 66.57],
      ["2.0", 69.19],
    ],
  ],
  [
    "1f · Guidance ω",
    [
      ["1.0 (without CFG)", 61.06],
      ["1.5", 33.33],
      ["2.0", 20.15],
      ["3.0", 15.53],
      ["5.0", 20.75],
    ],
  ],
];
ablations.forEach(([group, rows]) =>
  rows.forEach(([setting, fid]) =>
    experiments.push({
      table: "1",
      group,
      setting,
      fid,
      nfe: "1",
      params: "131M",
      metadata:
        "ImageNet 256×256 · B/4 · 80 epochs / 400K iterations · FID-50K; change one setting, other defaults fixed. κ=0 in 1f.",
      page: 8,
    }),
  ),
);
const comparison: [string, string, string, number, string][] = [
  ["iCT-XL/2†", "675M", "1", 34.24, "1-NFE diffusion/flow"],
  ["Shortcut-XL/2", "675M", "1", 10.6, "1-NFE diffusion/flow"],
  ["MeanFlow-B/2", "131M", "1", 6.17, "1-NFE diffusion/flow"],
  ["MeanFlow-M/2", "308M", "1", 5.01, "1-NFE diffusion/flow"],
  ["MeanFlow-L/2", "459M", "1", 3.84, "1-NFE diffusion/flow"],
  ["MeanFlow-XL/2", "676M", "1", 3.43, "1-NFE diffusion/flow"],
  ["iCT-XL/2†", "675M", "2", 20.3, "2-NFE diffusion/flow"],
  ["IMM-XL/2", "675M", "1×2", 7.77, "2-NFE diffusion/flow"],
  ["MeanFlow-XL/2", "676M", "2", 2.93, "2-NFE diffusion/flow"],
  ["MeanFlow-XL/2+", "676M", "2", 2.2, "2-NFE diffusion/flow"],
  ["BigGAN", "112M", "1", 6.95, "GAN"],
  ["GigaGAN", "569M", "1", 3.45, "GAN"],
  ["StyleGAN-XL", "166M", "1", 2.3, "GAN"],
  ["AR w/ VQGAN", "227M", "1024", 26.52, "Autoregressive/masking"],
  ["MaskGIT", "227M", "8", 6.18, "Autoregressive/masking"],
  ["VAR-d30", "2B", "10×2", 1.92, "Autoregressive/masking"],
  ["MAR-H", "943M", "256×2", 1.55, "Autoregressive/masking"],
  ["ADM", "554M", "250×2", 10.94, "Diffusion/flow"],
  ["LDM-4-G", "400M", "250×2", 3.6, "Diffusion/flow"],
  ["SimDiff", "2B", "512×2", 2.77, "Diffusion/flow"],
  ["DiT-XL/2", "675M", "250×2", 2.27, "Diffusion/flow"],
  ["SiT-XL/2", "675M", "250×2", 2.06, "Diffusion/flow"],
  ["SiT-XL/2+REPA", "675M", "250×2", 1.42, "Diffusion/flow"],
];
comparison.forEach(([setting, params, nfe, fid, group]) =>
  experiments.push({
    table: "2",
    setting,
    params,
    nfe,
    fid,
    group,
    metadata: `ImageNet 256×256 · class-conditional · FID-50K · CFG when applicable. ${setting.startsWith("MeanFlow") ? (setting.endsWith("+") ? "1,000 epochs; longer-training configuration." : "240 epochs.") : "Baseline duration not specified in this table."} ${setting.startsWith("iCT") ? "† iCT results reported by IMM." : ""}`,
    page: 9,
  }),
);
[
  ["iCT", 2.83],
  ["ECT", 3.6],
  ["sCT", 2.97],
  ["IMM", 3.2],
  ["MeanFlow", 2.92],
].forEach(([setting, fid]) =>
  experiments.push({
    table: "3",
    setting: String(setting),
    fid: Number(fid),
    params: "~55M",
    nfe: "1",
    group: "Unconditional CIFAR-10",
    metadata: `32×32 pixels · FID-50K · U-net · ${setting === "MeanFlow" ? "no preconditioner; 800K iterations" : "EDM preconditioner"}`,
    page: 9,
  }),
);
[
  ["0.0", 20.15],
  ["0.5", 19.15],
  ["0.8", 19.1],
  ["0.9", 18.63],
  ["0.95", 19.17],
].forEach(([setting, fid]) =>
  experiments.push({
    table: "5",
    setting: `κ = ${setting}`,
    fid: Number(fid),
    params: "131M",
    nfe: "1",
    group: "Improved guidance",
    metadata:
      "ImageNet · B/4 · 80-epoch ablation · effective ω′=2.0 fixed; ω=(1−κ)ω′.",
    page: 22,
  }),
);
export type ModelConfig = {
  name: string;
  params: number;
  flops: number;
  depth: number;
  hidden: number;
  heads: number;
  patch: number;
  epochs: number;
  effective: string;
  omega: string;
  interval: string;
};
export const models: ModelConfig[] = [
  {
    name: "B/4",
    params: 131,
    flops: 5.6,
    depth: 12,
    hidden: 768,
    heads: 12,
    patch: 4,
    epochs: 80,
    effective: "Table 1f",
    omega: "ω = ω′",
    interval: "[0.0, 1.0]",
  },
  {
    name: "B/2",
    params: 131,
    flops: 23.1,
    depth: 12,
    hidden: 768,
    heads: 12,
    patch: 2,
    epochs: 240,
    effective: "2.0",
    omega: "1.0",
    interval: "[0.0, 1.0]",
  },
  {
    name: "M/2",
    params: 308,
    flops: 54.0,
    depth: 16,
    hidden: 1024,
    heads: 16,
    patch: 2,
    epochs: 240,
    effective: "2.0",
    omega: "1.0",
    interval: "[0.0, 1.0]",
  },
  {
    name: "L/2",
    params: 459,
    flops: 80.9,
    depth: 24,
    hidden: 1024,
    heads: 16,
    patch: 2,
    epochs: 240,
    effective: "2.5",
    omega: "0.2",
    interval: "[0.0, 0.8]",
  },
  {
    name: "XL/2",
    params: 676,
    flops: 119.0,
    depth: 28,
    hidden: 1152,
    heads: 16,
    patch: 2,
    epochs: 240,
    effective: "2.5",
    omega: "0.2",
    interval: "[0.0, 0.75]",
  },
  {
    name: "XL/2+",
    params: 676,
    flops: 119.0,
    depth: 28,
    hidden: 1152,
    heads: 16,
    patch: 2,
    epochs: 1000,
    effective: "2.0",
    omega: "1.0",
    interval: "[0.3, 0.8]",
  },
];
export const configRows: { setting: string; values: string[] }[] = [
  ...(
    ["params", "flops", "depth", "hidden", "heads", "patch", "epochs"] as const
  ).map((key) => ({
    setting: {
      params: "Parameters (M)",
      flops: "FLOPs (G)",
      depth: "Depth",
      hidden: "Hidden dimension",
      heads: "Heads",
      patch: "Patch size",
      epochs: "Epochs",
    }[key],
    values: models.map((m) =>
      key === "patch"
        ? `${m.patch}×${m.patch}`
        : key === "flops"
          ? m.flops.toFixed(1)
          : String(m[key]),
    ),
  })),
  ...[
    ["Batch size", "256"],
    ["Dropout", "0.0"],
    ["Optimizer", "Adam"],
    ["Learning rate schedule", "constant"],
    ["Learning rate", "0.0001"],
    ["Adam (β₁, β₂)", "(0.9, 0.95)"],
    ["Weight decay", "0.0"],
    ["EMA decay", "0.9999"],
  ].map(([setting, value]) => ({ setting, values: models.map(() => value) })),
  {
    setting: "Ratio of r≠t",
    values: ["Table 1a", ...models.slice(1).map(() => "25%")],
  },
  {
    setting: "(r, t) conditioning",
    values: ["Table 1c", ...models.slice(1).map(() => "(t, t−r)")],
  },
  {
    setting: "(r, t) sampler",
    values: ["Table 1d", ...models.slice(1).map(() => "lognorm(−0.4, 1.0)")],
  },
  {
    setting: "Adaptive weight p",
    values: ["Table 1e", ...models.slice(1).map(() => "1.0")],
  },
  { setting: "CFG effective scale ω′", values: models.map((m) => m.effective) },
  { setting: "CFG ω, Eq. 21", values: models.map((m) => m.omega) },
  { setting: "CFG κ, Eq. 21", values: models.map(() => "κ = 1 − ω/ω′") },
  { setting: "Class condition dropout", values: models.map(() => "0.1") },
  {
    setting: "CFG triggered if t is in",
    values: models.map((m) => m.interval),
  },
];
export type PlotPoint = {
  label: string;
  x: number;
  y: number;
  approximate: boolean;
  group: string;
  params?: number;
};
export const scaling: PlotPoint[] = [
  ["B/2", 80, 9.8],
  ["B/2", 160, 7.0],
  ["B/2", 240, 6.17],
  ["M/2", 80, 6.9],
  ["M/2", 160, 5.4],
  ["M/2", 240, 5.01],
  ["L/2", 40, 8.5],
  ["L/2", 80, 5.2],
  ["L/2", 160, 4.3],
  ["L/2", 240, 3.84],
  ["XL/2", 40, 7.9],
  ["XL/2", 80, 4.9],
  ["XL/2", 160, 4.0],
  ["XL/2", 240, 3.43],
].map(([group, x, y]) => ({
  label: `${group} · ${x} epochs`,
  x: Number(x),
  y: Number(y),
  approximate: x !== 240,
  group: String(group),
}));
export const compute: PlotPoint[] = [
  ["MeanFlow-B/2", 35.32, 6.17, 131, "MeanFlow"],
  ["MeanFlow-M/2", 36.54, 5.01, 308, "MeanFlow"],
  ["MeanFlow-L/2", 37.11, 3.84, 459, "MeanFlow"],
  ["MeanFlow-XL/2", 37.66, 3.43, 676, "MeanFlow"],
  ["Shortcut-XL/2", 37.45, 10.6, 675, "Baseline"],
  ["IMM-XL/2 · 2 NFE", 39.49, 7.77, 675, "Baseline"],
  ["iCT-XL/2", 39.49, 34.24, 675, "Baseline"],
].map(([label, x, y, params, group]) => ({
  label: String(label),
  x: Number(x),
  y: Number(y),
  params: Number(params),
  group: String(group),
  approximate: true,
}));
