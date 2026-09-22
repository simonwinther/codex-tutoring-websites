# MeanFlow — From noise to one step

A local, interactive research explainer of the supplied **Mean Flows for One-step Generative Modeling** paper by Zhengyang Geng, Mingyang Deng, Xingjian Bai, J. Zico Kolter, and Kaiming He (NeurIPS 2025). The 12-chapter story covers the complete 23-page PDF, including substantive appendix and checklist material.

## Run locally

Requires a recent Node.js release compatible with Vite 8 (Node 22.12+; developed with Node 25) and npm.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite, normally `http://localhost:5173`. All runtime content, fonts, samples, mathematics, and simulations are served locally. Installation needs npm access; the running application does not call external services. Source links open only when selected. No image-model checkpoints, model downloads, backend, or API keys are required.

```sh
npm run build     # export source manifest, type-check, build dist/
npm run preview   # serve the production build
```

Deploy `dist/` with any static HTTP server. For a nested URL, build with `npm run build -- --base /your/path/`; the shared library build configures this automatically. Chapter links use stable fragments such as `#identity`, so no server route fallback is needed. Opening `index.html` directly with `file://` is not supported because the worker and modules use HTTP URLs.

## Verify

```sh
npm run typecheck
npm test
npm run test:browser
npm run check
```

The browser suite uses `/usr/bin/chromium` when available. Else install the matching Playwright browser with `npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an installed Chromium executable. Browser tests cover 1440×1000 desktop, 820×1180 tablet, and 390×844 mobile viewports, keyboard controls, dragging, every slider, architecture selectors, derivation steps, table and plot filters, glossary entries, gallery controls, walkthrough playback, deep links, history, resume, reduced motion, local requests, layout overflow, and axe accessibility checks. Screenshots and failure traces are written to `test-results/`.

Numerical tests check interpolation endpoints, the analytic marginal field against an independent conditional Monte Carlo calculation, reverse-time integration, RK4 convergence, exact average-velocity identities, additivity, the diagonal limit, finite-difference JVPs, frozen-target parameter gradients, guidance algebra, ordered time sampling, and finite loss weights. Content tests verify the numbered coverage inventory, equation parsing, complete table row counts, key result configurations, and all sample assets.

`npm run format` formats source and tests. `npm run coverage:export` regenerates the downloadable manifest after source changes.

## Implementation

- `src/App.tsx`: continuous chapter navigation, explicit resume, reading depth, glossary, concept map, and source browser.
- `src/chapters/`: connected explanations and full derivations.
- `src/components/`: SVG and Canvas laboratories, architecture, evidence plots, searchable tables, and native-dialog sample gallery.
- `src/math/flow.ts`: pure numerical functions and the differentiable scalar affine predictor.
- `src/math/trajectories.worker.ts`: seeded Gaussian-mixture RK4 paths, bounded worker cache, request IDs for discarding stale results. Components terminate their workers when unmounted. Animation pauses offscreen and honors reduced motion.
- `src/data/paper.ts`: typed chapter, equation, glossary, and paper references.
- `src/data/experiments.ts`: exact Tables 1–5 and explicitly approximate chart digitizations.
- `src/data/coverage.ts`: typed source-to-explanation mapping.
- `public/source-coverage.json`: exported page coverage, provenance, source PDF checksum, and image checksums.

React, TypeScript, Vite, D3 scales, Motion, and KaTeX provide the interface. Inter and Source Serif 4 are bundled via Fontsource. Mathematics renders as HTML and MathML. Network-independent operation means all resources are local once served; this does not install a service worker or promise a cached offline revisit.

## Scientific scope and provenance

The browser examples teach the mathematics; they do **not** reproduce ImageNet neural inference or retrain the paper's models. The Gaussian-mixture marginal field is analytic, and its trajectories are numerical RK4 references. A separate rotating field has closed-form interval averages and derivatives. The affine training laboratory performs an actual numerical parameter update with a frozen target, but is not an image generator. Guidance changes its illustrated target; slider positions never invent FID measurements.

The explainer preserves the distinction between flow-network training from scratch and the pretrained ImageNet VAE. It keeps 3.43 (XL/2, 240 epochs, 1 NFE), 2.93 (XL/2, 240 epochs, 2 NFE), and 2.20 (XL/2+, 1,000 epochs, 2 NFE) attached to their configurations. Table 2's SiT value 2.06 is used; conflicting prose value 2.15 is explicitly noted. FIDs are single-run measurements. Curated samples do not establish random-batch quality or statistical significance.

Figure 1's horizontal positions are digitized approximately (±0.05 in log₂ GFLOPs), with exact Table 2 FIDs. Figure 4's visible early FIDs are approximate (±0.1); its 240-epoch values are exact. Clipped B/2 and M/2 points at 40 epochs are omitted. Connecting lines are visual guides, not additional measurements. The original PDF remains available alongside each reconstruction.

All 24 original 256×256 RGB Figure 5 images were extracted with Poppler:

```sh
pdfimages -f 23 -l 23 -png 'Mean Flows.pdf' public/samples/figure5
```

They are lossless decoded image assets, not crops or generated replacements. Their content is unaltered; browser zoom only changes display size. Attribution is displayed in the gallery and the manifest. The supplied PDF and its figures remain the authors' work; inclusion here does not assert a new license for them. Font and runtime library notices are also copied into `public/licenses/` and included in the production build.

Authors' implementation: <https://github.com/gsunshine/meanflow>. This companion covers the supplied paper, not later improved MeanFlow or pixel MeanFlow publications. Appendix B.1's improved **guidance** is included.
