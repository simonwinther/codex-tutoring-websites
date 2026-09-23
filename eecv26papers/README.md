# Research Paper Atlas

An independent, static React/TypeScript application for understanding the research PDFs in `../ECCV26Papers/`. The source directory is capitalized; this application lives in `eecv26papers/`.

## Run

```sh
cd eecv26papers
npm ci
npm run dev
```

Open **http://localhost:5175/**. No API key, backend, or external content service is needed. Fonts, PDF.js worker, source PDFs, figures, and educational content are served locally. Reading and self-assessed study progress are stored in browser localStorage.

```sh
npm run build
npm run preview
npm test
npm run validate
```

Tests use `/usr/bin/chromium` locally. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to another Chromium executable if necessary. The repository root's existing build discovers this project and supplies its GitHub Pages base path. Hash routes support direct links and refreshes under a nested path.

## What is included

- A zoomable, pannable constellation with labelled, cited relationships; paper-card alternative.
- A Mostafa/thesis lens that distinguishes measured savings, enabling setups, added costs and applications.
- Eight guided paper pages: original figures, clickable method stages, separate training/inference flows, novelty, findings, counter-results, limitations and KaTeX equations.
- A 28-concept glossary, five focused concept views, and comparison of two to four papers.
- 64 paper-specific recall questions with hints, answers, self-assessed progress and a compact review view.
- PDF.js page navigation and zoom, accessible extracted text, high-resolution figure inspection, and vector-preserving crop downloads.
- DRIFT's actual PAD/AIS calculator, ParaFlow's actual Table 5 window results, and a clearly labelled KernelWave coefficient illustration.

## Reproduce PDF preprocessing

Python 3 and PyMuPDF are only required to regenerate assets, not to run or build the app. The generated data and assets are included.

```sh
python -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt
.venv/bin/python scripts/content.py
.venv/bin/python scripts/concepts.py
.venv/bin/python scripts/extract.py
.venv/bin/python scripts/validate.py
```

`extract.py` recursively discovers PDF files in `../ECCV26Papers/`. Override with `--source /path/to/papers`. There is no hardcoded expected count. Every discovered document receives a page count, SHA-256 fingerprint, extracted page text, and a source PDF copy. New files without reviewed annotations are listed as awaiting curation; their claims are not invented.

`content.py` is the transparent authoring source for the reviewed educational records and manually inspected figure bounds. `concepts.py` authors the glossary and cross-paper relationships. Scientific interpretation is editorial; it is deliberately not presented as reliable automatic PDF summarization.

Figures mix vector labels/arrows with embedded raster panels. Rendering the complete crop preserves those components together. Each crop is exported at **360 DPI (5 pixels per PDF point)** with its aspect ratio intact, plus a vector-preserving PDF clip. Crop coordinates use PDF points with a top-left origin. Page numbers always count physical PDF pages starting at one, including front matter and supplements.

## Data model

| File | Role |
| --- | --- |
| `data/inventory.json` | Automatically discovered documents, page counts, source hashes |
| `data/papers.json` | Educational content, stages, train/inference flows, metrics, questions, citations |
| `data/concepts.json` | Definitions and the different role of a concept in each paper |
| `data/relationships.json` | Connections with supporting sources from both endpoint papers |
| `data/figure-crops.json` | Reviewed crop bounds and pedagogical selection notes |
| `data/figures.json` | Extracted captions, image/vector paths, page numbers and source hashes |
| `data/extracted/` | Page-delimited text used during source review |
| `public/paper-assets/` | Original source copies and directly extracted visuals |

Claims carry `{text, kind, source: {page, label}}`. Results retain metric, dataset/setting, baseline, values, direction, notes and source. Equations include symbols and a plain-language interpretation. Figures are data-driven, not hardcoded into paper-specific React markup.

See [SOURCE_REVIEW.md](SOURCE_REVIEW.md) for important source qualifications and accuracy decisions.

## Validation scope

`validate.py` checks discovered-versus-curated coverage, all citation page bounds, result context, 3/3/2 question composition, source-copy hashes, crop provenance, asset presence, resolution and aspect ratio. It does **not** claim to mechanically prove scientific accuracy.

The Playwright suite verifies all paper pages and images, navigation and filters, methods, original-PDF rendering and page navigation, comparisons, study persistence, interactive calculations, and phone layouts. The root hosting checks verify the complete library deployment. `scripts/preview.mjs` at the repository root includes the `.mjs` MIME type needed by PDF.js's module worker.

Implementation references: [PDF.js examples](https://mozilla.github.io/pdf.js/examples/) and [Vite static deployment](https://vite.dev/guide/static-deploy.html). Scientific content comes from the local PDFs, not these web references.
