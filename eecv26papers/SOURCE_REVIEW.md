# Source review and scientific boundaries

All eight documents were read from the local capitalized `ECCV26Papers` source directory. Filenames were used for discovery only; titles, method explanations, supervision, results and figure choices come from PDF text and rendered pages. The app does not claim that every manuscript has an ECCV venue: ParaFlow's supplied first page says it is under review at ICLR 2026.

The study is an educational synthesis, not an independent reproduction of the papers' experiments. Author hypotheses, scope limitations, source inconsistencies and editorial reading boundaries are labelled separately in the data and interface. Cross-paper edges describe common concepts; they do not assert that either paper cites the other, nor that a proposed combination has been tested.

## Paper-by-paper checks

| Paper | Main source visual | Method / deployment source | Results and qualifications checked |
| --- | --- | --- | --- |
| Transferability | Fig. 1, PDF p. 5 | pp. 5–13; Appendix A on physical p. 25 | Table 1 contains one-way improvements in BAGEL/BLIP3-o, despite the abstract's broad shorthand. Do not say only a fully shared model transfers. Table 2 FID uses baseline-generated images as reference (p. 9). Table 3 direct generation has higher spatial accuracy. Physical p. 42 describes architectural/task limitations. |
| SPHERE | Fig. 3, p. 5 | pp. 6–9 | DVF is explicitly not exact physical deformation (p. 7). Recovery uses metadata during training, not deployment. Recovery/DVF computation is preprocessing, excluded from the segmentation cost analysis (p. 14). Table 6 ablations and Table 7 generalization results were checked. |
| Physics-Grounded Flow / PDF | Fig. 3, p. 7 | pp. 5–10; Appendix D/E pp. 22–23 | Concentration is derived from a signed-distance transform of masks. Physics is soft regularization, not an exact biological simulator. Baseline masks are required. UCSF DSC improves while PSNR decreases relative to T-UNet. The LUMIERE full-model PSNR differs between Tables 1 and 2; values are not silently combined. |
| DRIFT | Fig. 2, p. 5 | pp. 6–10 | APN is frozen during stage-2 training. No noise start. AIS uses metadata, with 0–15 velocity NFEs; the APN is extra cost. Main target thicknesses are fixed native resolutions. Real thick-slice examples lack isotropic ground truth (pp. 12–13). Table 1 results and Fig. 6 NFE comparison were checked. |
| C2P | Fig. 2, p. 5 | pp. 4–9; fixed text embeddings p. 28 | Geometry attributes come from masks, text embeddings from offline Qwen3-VL-Plus/PubMedBERT. Learned semantic tokens are trained; the offline text targets are frozen. Inference does not require an MLLM or prompt. Geometry consensus is multiple-view inference, not established acceleration. Table 2's ISBI EM failure (26.79 Dice) and other non-wins are retained. |
| ParaFlow | Algorithm 1, p. 4 | pp. 3–5; proofs p. 12 | There is no architecture overview figure equivalent to the algorithm, so Algorithm 1 is the principal original visual. Exact fixed-point convergence recovers the chosen discrete sampler trajectory; practical tolerance is approximate. Eight Ascend 910B devices are used. Table 5 latency reduction accompanies higher total NFEs. SD3 Table 1 provides a FID counter-result. |
| DeBaT | Fig. 3, p. 7 | pp. 8–10 | Low/high branches have different objectives; generator models concatenated learned latents, not raw bands. Matched latent size is not matched tokenizer size/cost. Table 5 reports higher parameters and latency than VA-VAE. Table 2 includes REPA's lower CFG gFID at a longer training schedule, so “best among all rows” is not repeated. rFID entries differ between Tables 1 and 3 and are qualified. |
| WCC4MS | Fig. 2, p. 5 | pp. 5–9 | KernelWave is a proxy, not exact kernel simulation. The domain head is predictive, not adversarial. Candidate localization is assumed; only segmentation is deployed. Excessive box supervision can hurt. The UNETR MSD-Lung HD95 non-win is retained. An MRI extension is reported despite a CT-centric introduction. |

## Important distinctions kept visible

- ParaFlow latency, sequential iterations and total NFEs are separate quantities.
- MRI acquisition sampling is distinct from generative-model sampling.
- DeBaT learns frequency-separated representations; KernelWave makes frequency-perturbed training images. PDF uses Difference-of-Gaussians texture guidance, and SPHERE uses FFT rather than Haar.
- Physics-inspired proxy, physics regularizer and exact physical simulation are different claims.
- C2P reduces prompts/references at inference; this is not evidence that it needs fewer training masks.
- A better downstream representation can cost more parameters or latency.
- Native target-resolution conditioning is not proof of arbitrary target-resolution generalization.
- HD (PDF) is not HD95 (SPHERE/WCC4MS). SPHERE's printed HD95 equation uses maxima despite its percentile wording; the glossary records the mismatch rather than silently presenting it as a correct percentile formula.

## Figure review

Twenty-four crops were selected after reviewing rendered PDF pages. Captions are extracted from the PDF text layer. Mixed vector/raster figures are rendered as complete units, preserving labels, legends and arrows. All crops were visually checked in contact sheets; expanded bounds preserve the far-right columns of ParaFlow Table 5 and PDF Table 3. A vector-preserving clip accompanies each raster image. Raster panels cannot gain real detail beyond the original embedded source; high-DPI rendering preserves available detail without substituting external images.

## Thesis interpretation

The Mostafa/thesis map is a proposed reading framework. It does not claim knowledge of a supervisor's intentions. Added-cost and enabling-setup entries are explicitly distinguished from demonstrated efficiency contributions. Potential method combinations are labelled as hypotheses requiring new experiments.
