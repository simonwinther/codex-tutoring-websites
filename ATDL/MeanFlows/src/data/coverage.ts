import { equations } from "./paper";
export type SourceReference = {
  id: string;
  title: string;
  pages: number[];
  chapter: string;
  kind: "equation" | "algorithm" | "figure" | "table" | "appendix" | "context";
  implementation: string;
};
export const coverage: SourceReference[] = [
  ...equations.map((e) => ({
    id: `equation-${e.id}`,
    title: `Equation ${e.id} · ${e.name}`,
    pages: [e.page],
    chapter: e.chapter,
    kind: "equation" as const,
    implementation:
      "src/data/paper.ts + Equation component in the linked chapter",
  })),
  {
    id: "algorithm-1",
    title: "Algorithm 1 · MeanFlow training",
    pages: [5],
    chapter: "training",
    kind: "algorithm",
    implementation:
      "TrainingLab: computed interpolation, JVP, detached target, loss, real affine update",
  },
  {
    id: "algorithm-2",
    title: "Algorithm 2 · One-step sampling",
    pages: [5],
    chapter: "sampling",
    kind: "algorithm",
    implementation:
      "Algorithm pseudocode, SamplingLab and connected Walkthrough",
  },
  {
    id: "figure-1",
    title: "Figure 1 · One-step compute comparison",
    pages: [1],
    chapter: "evidence",
    kind: "figure",
    implementation:
      "EvidencePlots: exact FIDs, approximate digitized compute; accessible data",
  },
  {
    id: "figure-2",
    title: "Figure 2 · Conditional and marginal fields",
    pages: [3],
    chapter: "flow",
    kind: "figure",
    implementation:
      "FlowLab: sample-pair interpolation and analytic Gaussian-mixture marginal",
  },
  {
    id: "figure-3",
    title: "Figure 3 · Average-velocity geometry",
    pages: [4],
    chapter: "average",
    kind: "figure",
    implementation:
      "AverageLab: draggable rotating-flow endpoints, tangent, average, displacement",
  },
  {
    id: "figure-4",
    title: "Figure 4 · Scaling",
    pages: [9],
    chapter: "evidence",
    kind: "figure",
    implementation:
      "EvidencePlots: visible points only; exact 240-epoch endpoints; early FIDs approximate",
  },
  {
    id: "figure-5",
    title: "Figure 5 · Curated ImageNet outputs",
    pages: [23],
    chapter: "evidence",
    kind: "figure",
    implementation:
      "SampleGallery: all 24 original embedded images, lossless PNG extraction, zoom dialog",
  },
  ...[1, 2, 3, 4, 5].map((n) => ({
    id: `table-${n}`,
    title: `Table ${n} · ${["All six ablations", "ImageNet results", "CIFAR-10 results", "Full ImageNet configurations", "Improved CFG"][n - 1]}`,
    pages: [n === 1 ? 8 : n < 4 ? 9 : n === 4 ? 21 : 22],
    chapter: "evidence",
    kind: "table" as const,
    implementation:
      "src/data/experiments.ts + searchable EvidenceTables; Table 4 also drives Architecture",
  })),
  {
    id: "appendix-a-imagenet",
    title: "Appendix A · ImageNet implementation",
    pages: [21],
    chapter: "model",
    kind: "appendix",
    implementation: "Architecture and full Table 4, time embeddings, VAE scope",
  },
  {
    id: "appendix-a-cifar",
    title: "Appendix A · CIFAR-10 implementation",
    pages: [21],
    chapter: "model",
    kind: "appendix",
    implementation:
      "CIFAR U-net deep dive: all reported hyperparameters and augmentation exceptions",
  },
  {
    id: "appendix-b1",
    title: "Appendix B.1 · Improved guidance",
    pages: [22],
    chapter: "guidance",
    kind: "appendix",
    implementation:
      "Eq.20–21 derivation, effective scale, GuidanceLab, Table 5",
  },
  {
    id: "appendix-b2",
    title: "Appendix B.2 · Loss metrics",
    pages: [22],
    chapter: "guidance",
    kind: "appendix",
    implementation:
      "Adaptive-weight lab and powered-loss gradient derivation, p=1 subtlety",
  },
  {
    id: "appendix-b3",
    title: "Appendix B.3 · Sufficiency proof",
    pages: [22, 23],
    chapter: "identity",
    kind: "appendix",
    implementation:
      "Eq.23–24 proof with regularity and zero-diagonal boundary condition",
  },
  {
    id: "appendix-b4",
    title: "Appendix B.4 · JVP cost",
    pages: [23],
    chapter: "training",
    kind: "appendix",
    implementation:
      "Forward-mode / parameter-gradient distinction, 0.045 vs 0.052 sec/iter v4-8 benchmark",
  },
  {
    id: "appendix-c",
    title: "Appendix C · Qualitative results",
    pages: [23],
    chapter: "evidence",
    kind: "appendix",
    implementation: "Attributed gallery with curated-selection caveat",
  },
  {
    id: "context-intro",
    title: "Abstract, introduction, related work, background",
    pages: [1, 2, 3],
    chapter: "generation",
    kind: "context",
    implementation:
      "Chapters 1–3 introduce generation, distributions, Flow Matching and costs",
  },
  {
    id: "context-design",
    title: "Design decisions and ablation interpretations",
    pages: [7, 8],
    chapter: "guidance",
    kind: "context",
    implementation:
      "Sampling and loss labs; discrete experimental results, no invented continuous FID",
  },
  {
    id: "context-conclusion",
    title: "Related work and conclusion",
    pages: [2, 6, 9],
    chapter: "perspective",
    kind: "context",
    implementation:
      "Diffusion, consistency, flow maps, Shortcut, IMM and coarser dynamics",
  },
  {
    id: "context-refs",
    title: "Acknowledgments and bibliography",
    pages: [10, 11, 12, 13],
    chapter: "perspective",
    kind: "context",
    implementation:
      "Source attribution and linked original references; bibliographic entries are not separate lessons",
  },
  {
    id: "context-checklist",
    title: "NeurIPS checklist",
    pages: [14, 15, 16, 17, 18, 19, 20],
    chapter: "perspective",
    kind: "context",
    implementation:
      "Substantive author disclosures: single runs, absent limitations/impact sections, compute, public assets and no human subjects; checklist boilerplate not repeated",
  },
];
