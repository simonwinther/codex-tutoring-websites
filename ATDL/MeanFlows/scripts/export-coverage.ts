import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { coverage } from "../src/data/coverage";
const sha256 = (path: string) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
const manifest = {
  paper: "Mean Flows for One-step Generative Modeling",
  authors: [
    "Zhengyang Geng",
    "Mingyang Deng",
    "Xingjian Bai",
    "J. Zico Kolter",
    "Kaiming He",
  ],
  venue: "NeurIPS 2025",
  sourcePdf: "Mean Flows.pdf",
  sourceSha256: sha256("Mean Flows.pdf"),
  pageCount: 23,
  scope:
    "The supplied PDF, including substantive appendices and checklist disclosures. Subsequent MeanFlow variants are outside scope.",
  provenance: {
    paper: "Numbered equations and measurements transcribed from supplied PDF.",
    intuition:
      "Plain-language explanations and misconception callouts are added teaching commentary.",
    simulation:
      "Gaussian-mixture marginal field, rotating field, and affine predictor are calculated teaching examples, not paper models.",
    architecture:
      "Schematic explanation of the documented DiT and U-net setups.",
    charts:
      "Figure 1 compute positions digitized approximately ±0.05 log2 GFLOPs. Figure 4 nonterminal visible FIDs digitized approximately ±0.1. Tabulated endpoints exact; clipped points omitted.",
    images:
      "24 original 256×256 RGB images extracted with pdfimages -f 23 -l 23 -png. No image edits.",
  },
  entries: coverage,
  images: readdirSync("public/samples")
    .filter((f) => f.endsWith(".png"))
    .map((file, i) => ({
      file: `samples/${file}`,
      figure: 5,
      page: 23,
      index: i + 1,
      sha256: sha256(`public/samples/${file}`),
    })),
};
writeFileSync(
  "public/source-coverage.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
