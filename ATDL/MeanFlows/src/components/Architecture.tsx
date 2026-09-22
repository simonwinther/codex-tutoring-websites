import { useState } from "react";
import { models } from "../data/experiments";
import { Choice } from "./common";
export function Architecture() {
  const [name, setName] = useState("B/2"),
    [selected, setSelected] = useState(3);
  const m = models.find((m) => m.name === name)!;
  const tokens = (32 / m.patch) ** 2;
  const blocks = [
    {
      title: "VAE encoder",
      sub: "256 × 256 × 3 → latents",
      detail:
        "A pretrained VAE compresses each training image into 32×32×4 latent values. The flow network is trained from scratch; the VAE is not. At generation time, a VAE decoder converts the predicted clean latent back to pixels.",
    },
    {
      title: "Noisy latent",
      sub: "32 × 32 × 4",
      detail:
        "Training mixes a clean image latent with Gaussian noise at time t. Inference begins with Gaussian noise of exactly this shape. The flow model operates in latent space.",
    },
    {
      title: "Patch embedding",
      sub: `${m.patch} × ${m.patch} patches · ${tokens} tokens`,
      detail: `Each of the ${tokens} patches contains ${m.patch * m.patch * 4} scalar values, projected into a ${m.hidden}-dimensional token. Positional information tells the Transformer where a token belongs.`,
    },
    {
      title: "Conditioned DiT",
      sub: `${m.depth} blocks · ${m.hidden} hidden`,
      detail: `Each block uses ${m.heads}-head self-attention so one patch can use information from others, followed by a feed-forward network. adaLN-Zero injects time and class information via normalization modulation and residual gates. This is an explanatory schematic, not an additional architecture proposed by the paper.`,
    },
    {
      title: "Average velocity",
      sub: "32 × 32 × 4 · uθ(z,r,t)",
      detail:
        "A final projection returns patch outputs to the latent grid. The result is an average-velocity vector with the same shape as z. Subtract (t−r)uθ to move to a lower time; decode the final clean latent through the VAE.",
    },
  ];
  return (
    <div className="architecture">
      <div className="lab-heading">
        <span>EXPLORE / THE IMAGENET BACKBONE</span>
        <span className="tag">Table 4 · architecture schematic</span>
      </div>
      <Choice
        label="Model size"
        options={models.map((m) => m.name)}
        value={name}
        onChange={setName}
      />
      <div className="architecture-flow">
        {blocks.map((b, i) => (
          <button
            key={b.title}
            onClick={() => setSelected(i)}
            className={selected === i ? "selected" : ""}
            aria-pressed={selected === i}
          >
            <span className="block-number">0{i + 1}</span>
            <span className="block-glyph" aria-hidden="true">
              {["▧", "▦", "⊞", "≋", "↗"][i]}
            </span>
            <strong>{b.title}</strong>
            <small>{b.sub}</small>
          </button>
        ))}
      </div>
      <div className="conditioning">
        <span>t → positional embedding → 2-layer MLP</span>
        <span>+</span>
        <span>t−r → positional embedding → 2-layer MLP</span>
        <span>→ sum + class conditioning → DiT blocks</span>
      </div>
      <div className="architecture-explanation" aria-live="polite">
        <b>{blocks[selected].title}</b>
        <p>{blocks[selected].detail}</p>
      </div>
      <div className="metric-strip">
        <div>
          <span>Parameters</span>
          <strong>{m.params}M</strong>
        </div>
        <div>
          <span>Compute</span>
          <strong>{m.flops.toFixed(1)} G</strong>
        </div>
        <div>
          <span>Training</span>
          <strong>{m.epochs} epochs</strong>
        </div>
        <div>
          <span>Attention heads</span>
          <strong>{m.heads}</strong>
        </div>
      </div>
    </div>
  );
}
