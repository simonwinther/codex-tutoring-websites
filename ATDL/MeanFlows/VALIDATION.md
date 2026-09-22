# Verification record

Completed against the supplied 23-page PDF and the implemented application on 18 September 2026.

- TypeScript type check: passed.
- Production build: passed; local worker and font assets emitted, with separate React, Motion, and KaTeX bundles.
- Vitest: **20 tests passed**, covering numerical behavior and the source inventory.
- Playwright: **12 tests passed**, four workflows at each of 1440×1000, 820×1180, and 390×844.
- Axe scans: no WCAG 2 A/AA or WCAG 2.1 AA violations reported in the tested page states. This is automated coverage, not a claim of exhaustive accessibility certification.
- Browser runtime: no page errors; production smoke checks also collected console errors and reported none.
- Local runtime: browser requests stayed on the local origin. No model or external service requests.

Every chapter was rendered and inspected at all three standard widths. Both reading-depth modes were checked for horizontal overflow. Laboratory controls, keyboard and pointer dragging, architecture choices, checkpoints, all table filters, chart filters, glossary entries, gallery controls, and walkthrough controls were exercised. Deep links, browser history, saved reading depth, explicit resume, and reduced-motion behavior passed.

Additional production checks covered widths from 320 to 1440 pixels, all ten concept-map links and active-section updates, source search, rapid particle reseeding, offscreen animation suspension, fresh training-example draws, extreme guidance controls, and mobile gallery zoom. At 3× zoom the original image remains horizontally scrollable, and Escape returns focus to its originating thumbnail.

The served PDF is byte-identical to the supplied PDF. All 24 sample PNGs were compared byte-for-byte with a fresh `pdfimages` extraction from page 23. Individual hashes and the PDF hash are retained in `public/source-coverage.json`.

The source audit maps 24 equations, two algorithms, five figures, five tables, and substantive appendix/checklist material through 48 coverage entries spanning every PDF page. Tables contain all 27 Table 1 ablation rows, 23 Table 2 comparison rows, five Table 3 rows, 24 Table 4 configuration rows across six models, and five Table 5 rows. Earlier chart points are explicitly approximate; missing/clipped measurements are omitted.

The simulations verify and illustrate the mathematics. They do not validate the authors' full neural training pipeline or reproduce image-model FID measurements. Paper results and original curated samples retain their source attribution and configuration metadata.

Reproduce the main release checks with `npm run check`. Browser screenshots and traces are written under `test-results/`; see `README.md` for browser setup and individual scripts.
