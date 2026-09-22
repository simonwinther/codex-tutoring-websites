import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { SamplingLab } from "../components/FlowLabs";
import {
  EvidencePlots,
  EvidenceTables,
  SampleGallery,
} from "../components/Evidence";
import {
  Callout,
  Checkpoint,
  DeepDive,
  Equation,
  MathText,
  useReducedMotion,
  useVisible,
} from "../components/common";
import { affine, initialParams, trainingStep } from "../math/flow";
import { authorsUrl, paperUrl } from "../data/paper";
export function Sampling() {
  return (
    <>
      <p className="lead">
        Once the model knows the average velocity, generation is a subtraction.
        Draw noise. Predict the interval’s average. Move to the data endpoint.
      </p>
      <Equation id={12} />
      <div className="algorithm-two">
        <span>ALGORITHM 2</span>
        <code>
          ε ← Gaussian noise
          <br />x ← ε − uθ(ε, r=0, t=1)
        </code>
        <span>1 model evaluation</span>
      </div>
      <SamplingLab />
      <Callout title="An exact average skips numerical integration; a learned average can still be wrong">
        With the true u, a whole interval reaches its exact endpoint. With uθ,
        the remaining error comes from approximating that average. More sampling
        steps can help in practice, but the definition alone does not promise
        that every imperfect predictor improves with more steps.
      </Callout>
      <DeepDive title="One step, few steps, and NFE">
        <p>
          A few-step schedule chooses descending times 1=t₀&gt;t₁&gt;…&gt;tₙ=0
          and repeatedly applies Eq. 12. Each MeanFlow prediction costs one
          flow-network evaluation. The pretrained VAE decoder is additional
          pipeline work; the reported flow-model NFE does not count it as
          another diffusion step.
        </p>
        <p>
          Conventional sampling-time CFG evaluates conditional and unconditional
          predictions separately, commonly doubling NFE per step. MeanFlow folds
          guidance into its training target, so a guided one-step prediction
          uses one NFE. A different method’s “one-step” result can therefore
          have two NFE.
        </p>
        <p>
          A numerical toy average computed by integrating v would use many
          underlying field evaluations. It illustrates the target field; it is
          not evidence of actual one-evaluation inference. Our rotating example
          avoids numerical integration with a closed-form average, but it
          remains a toy formula rather than a neural model.
        </p>
      </DeepDive>
      <Checkpoint
        question="Which operation generates from noise with a one-step MeanFlow model?"
        options={["ε + uθ(ε,0,1)", "ε − uθ(ε,0,1)", "Run the JVP at inference"]}
        correct={1}
        explanation="Generation runs from t=1 to r=0, so z₀=ε−uθ(ε,0,1). The JVP is used for training, not Algorithm 2."
      />
    </>
  );
}
export function Evidence() {
  return (
    <>
      <p className="lead">
        The headline is strong one-evaluation image generation. The details tell
        us which comparison that headline supports.
      </p>
      <div className="result-strip">
        <div>
          <strong>3.43</strong>
          <span>FID · 1 NFE</span>
          <small>XL/2 · 240 epochs</small>
        </div>
        <div>
          <strong>2.93</strong>
          <span>FID · 2 NFE</span>
          <small>XL/2 · 240 epochs</small>
        </div>
        <div>
          <strong>2.20</strong>
          <span>FID · 2 NFE</span>
          <small>XL/2+ · 1,000 epochs</small>
        </div>
      </div>
      <p>
        <b>FID</b> compares the means and covariances of features extracted from
        generated and real image sets. Lower is better. The paper evaluates
        50,000 generated images, abbreviated FID-50K. FID does not measure
        whether an individual image is “correct,” and it does not capture every
        aspect of quality or diversity.
      </p>
      <EvidencePlots />
      <h3>Every table, with its context.</h3>
      <p>
        Search models, experimental settings, or metadata. Sort measured FIDs,
        compare individual ablations, or inspect the full training
        configurations. All tabulated measurements are transcribed exactly.
      </p>
      <EvidenceTables />
      <Callout title="A discrepancy in the source">
        Table 2 reports SiT-XL/2 at 2.06 FID; the prose on page 8 says 2.15.
        This explainer uses the table’s 2.06 and preserves the discrepancy here
        instead of silently reconciling it.
      </Callout>
      <DeepDive title="How to read the comparisons">
        <p>
          For 1-NFE ImageNet generation, MeanFlow-XL/2’s 3.43 compares with
          Shortcut’s 10.60. IMM’s 7.77 is one step but 2 NFE because of
          guidance. At 2 NFE, MeanFlow-XL/2 reaches 2.93; 2.20 requires XL/2+,
          1,000 epochs and a different longer-training configuration.
        </p>
        <p>
          The main ablations use B/4 for 80 epochs (400K iterations), without
          CFG unless it is the variable under study. The paper’s contextual
          many-step references are DiT-B/4 at 68.4 and the authors’ SiT-B/4
          reproduction at 58.9, both using 250 NFE. These are prose references,
          distinct from the XL/2 comparisons in Table 2.
        </p>
        <p>
          Parameter count, architecture, duration, representation learning, and
          sampling budget vary across baselines. GAN, autoregressive, masking,
          and many-step diffusion entries are reference points, not controlled
          one-variable comparisons. SiT+REPA uses representation alignment,
          which this paper leaves for future work on MeanFlow.
        </p>
        <p>
          CIFAR-10 is more modest: MeanFlow’s 2.92 is competitive, while iCT
          reports 2.83. All listed methods use roughly the same 55M U-net size,
          but MeanFlow omits the EDM preconditioner used by those baselines.
        </p>
      </DeepDive>
      <SampleGallery />
    </>
  );
}
export function Perspective() {
  return (
    <>
      <p className="lead">
        The contribution is a useful quantity to learn: velocity averaged across
        an interval. Its identity comes from the underlying dynamics, before
        choosing a neural network.
      </p>
      <div className="relationship-list">
        {[
          [
            "Diffusion & Flow Matching",
            "Diffusion can be related to probability-flow ODEs; Flow Matching learns instantaneous velocities. MeanFlow models the interval average of a velocity field.",
          ],
          [
            "Consistency models",
            "They encourage agreement of outputs along a trajectory, typically anchored at the data endpoint. In this notation that anchor fixes r=0. MeanFlow conditions on both r and t.",
          ],
          [
            "Flow maps & trajectory models",
            "A flow map sends a state at one time to another. MeanFlow’s displacement (t−r)u expresses the same endpoint movement through a different parameterization. Some earlier trajectory methods use training-time ODE solvers.",
          ],
          [
            "Shortcut models",
            "They combine Flow Matching with explicit self-consistency relations across discrete intervals. MeanFlow derives its training relation by differentiating the average-velocity definition.",
          ],
          [
            "Inductive Moment Matching",
            "IMM uses self-consistency of stochastic interpolants across time steps. Its one-step ImageNet result in this paper includes two guidance evaluations.",
          ],
        ].map(([title, body]) => (
          <div key={title}>
            <h4>{title}</h4>
            <p>{body}</p>
          </div>
        ))}
      </div>
      <h3>What the evidence leaves open.</h3>
      <p>
        The paper demonstrates ImageNet 256×256 and unconditional CIFAR-10
        generation. It does not establish equal gains for video, language, all
        resolutions, or every architecture. The identity is exact under its
        regularity assumptions; successful finite training remains an empirical
        result.
      </p>
      <Callout title="Single runs, curated examples">
        The NeurIPS checklist explicitly reports single-run FID-50K scores
        without variance estimates because repeated ImageNet training is
        expensive. Figure 5 is curated. Neither close FID differences nor the
        sample gallery establish statistical significance.
      </Callout>
      <DeepDive title="Read the whole source, including its checklist">
        <p>
          The checklist on pages 14–20 reports no dedicated limitations
          discussion and no broader-impact section. The authors acknowledge
          imperfect image quality. It reports theory assumptions and a
          sufficiency proof, experimental details and code access, and a compute
          benchmark. It does not report error bars.
        </p>
        <p>
          The authors state that they used public datasets and no human-subject
          research; related safeguards and IRB questions are marked not
          applicable. The checklist also contains submission-time statements
          about future code and checkpoint release, while the supplied document
          links released code. Those are statements from different parts of this
          document, not a new audit of the project’s current release.
        </p>
        <p>
          References and acknowledgments occupy pages 10–13. They attribute the
          datasets, VAE, DiT backbone, Flow Matching, consistency methods,
          guidance, and compute support used in the work.{" "}
          <a href={paperUrl(10)} target="_blank" rel="noreferrer">
            Read the original references and acknowledgments ↗
          </a>
        </p>
        <p>
          This explainer covers the supplied 23-page paper. Subsequent improved
          MeanFlow and pixel MeanFlow papers linked by the repository are
          outside its scope. Appendix B.1’s improved <em>guidance</em> is part
          of this paper and should not be confused with a subsequent MeanFlow
          variant.
        </p>
      </DeepDive>
      <h3>A coarser description of dynamics.</h3>
      <p>
        The conclusion connects MeanFlow to multi-scale simulation: sometimes
        the useful quantity describes a larger span of space or time directly.
        Learning that quantity can avoid resolving every intermediate instant.
        This is a research direction suggested by the authors, not a
        demonstrated general-purpose replacement for numerical simulation.
      </p>
    </>
  );
}
const run = trainingStep(initialParams, 0.8, -0.6, 0.2, 0.75);
const walkthroughSteps = [
  {
    title: "Choose a training example",
    chapter: "generation",
    tex: String.raw`x=0.8,\quad \epsilon=-0.6,\quad r=0.2,\quad t=0.75`,
    text: "Draw data and independent Gaussian noise, then sample two ordered times. This connected walkthrough uses one scalar example so every value is visible.",
  },
  {
    title: "Make a noisy input",
    chapter: "flow",
    tex: String.raw`z_t=(1-0.75)(0.8)+0.75(-0.6)=-0.25`,
    text: "The corresponding sample velocity is ε−x=−1.4. The straight interpolation supplies a stochastic training signal.",
  },
  {
    title: "Predict and take the JVP",
    chapter: "training",
    tex: String.raw`u_\theta=0.010,\qquad J_u(v,0,1)=0.3(-1.4)+0.1=-0.320`,
    text: "The small predictor starts with parameters (a,b,c,d)=(0.3,−0.2,0.1,0.05). The spatial and time partial derivatives both contribute.",
  },
  {
    title: "Construct a detached target",
    chapter: "identity",
    tex: String.raw`u_{\rm tgt}=-1.4-(0.75-0.2)(-0.32)=-1.224`,
    text: "Hold this target fixed for the parameter update. No trajectory integral is evaluated in Algorithm 1.",
  },
  {
    title: "Calculate loss and update",
    chapter: "training",
    tex: String.raw`\mathcal L=(0.010+1.224)^2=1.522756,\qquad\theta\leftarrow\theta-0.04\nabla_\theta\mathcal L`,
    text: `A real detached update gives θ=(${run.next.map((n) => n.toFixed(4)).join(", ")}). The loss against the frozen target falls to ${run.lossAfterFrozen.toFixed(4)}. This one update does not train a useful generator.`,
  },
  {
    title: "Repeat the learning process",
    chapter: "guidance",
    tex: String.raw`u^{\rm cfg}_{\rm tgt}=\widetilde v_t-(t-r)\,J_{u_\theta}(\widetilde v_t,0,1)`,
    text: "A real model repeats training over many examples and time intervals. Guidance modifies the target and its JVP direction; adaptive weighting changes each example’s gradient contribution.",
  },
  {
    title: "Start generation from new noise",
    chapter: "sampling",
    tex: String.raw`z_1=\epsilon,\qquad r=0,\quad t=1`,
    text: "After training, draw fresh noise with the model’s input shape. ImageNet uses a 32×32×4 latent tensor. There is no clean training image in this inference call.",
  },
  {
    title: "Evaluate the learned average once",
    chapter: "sampling",
    tex: String.raw`u_\theta(\epsilon,0,1)`,
    text: "A trained MeanFlow network predicts the average across the whole interval. Its guidance is already built into the learned field; the training-time JVP is unnecessary now.",
  },
  {
    title: "Subtract, then decode",
    chapter: "model",
    tex: String.raw`z_0=\epsilon-u_\theta(\epsilon,0,1)`,
    text: "Subtract the predicted displacement to reach the clean latent, then use the VAE decoder to produce pixels. This is Algorithm 2: one evaluation of the flow network, plus decoding.",
  },
];
export function Walkthrough() {
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    { ref, visible } = useVisible<HTMLDivElement>(),
    reduced = useReducedMotion();
  useEffect(() => {
    if (!playing || !visible || reduced) return;
    const id = setInterval(
      () =>
        setStep((s) => {
          if (s >= walkthroughSteps.length - 1) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        }),
      4500,
    );
    return () => clearInterval(id);
  }, [playing, visible, reduced]);
  const s = walkthroughSteps[step];
  return (
    <>
      <p className="lead">
        One training recipe, one learned field, one inference call. Follow the
        full method with the ideas now connected.
      </p>
      <div className="walkthrough" ref={ref}>
        <div className="walkthrough-track">
          {walkthroughSteps.map((s, i) => (
            <button
              key={s.title}
              aria-label={`Walkthrough step ${i + 1}: ${s.title}`}
              aria-current={step === i ? "step" : undefined}
              onClick={() => {
                setStep(i);
                setPlaying(false);
              }}
              className={i <= step ? "complete" : ""}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <motion.div
          key={step}
          initial={{ opacity: reduced ? 1 : 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="eyebrow">
            {step < 6 ? "TRAINING" : "GENERATION"} / {step + 1} OF{" "}
            {walkthroughSteps.length}
          </span>
          <h3>{s.title}</h3>
          <MathText tex={s.tex} block />
          <p>{s.text}</p>
          <a href={`#${s.chapter}`}>Revisit the explanation ↗</a>
        </motion.div>
        <div className="playback">
          <button
            disabled={step === 0}
            onClick={() => {
              setStep((s) => s - 1);
              setPlaying(false);
            }}
          >
            ← Previous
          </button>
          <button
            className="primary-button"
            onClick={() => {
              if (reduced) {
                setStep((s) => (s + 1) % walkthroughSteps.length);
              } else {
                if (step === walkthroughSteps.length - 1) setStep(0);
                setPlaying((p) => !p);
              }
            }}
          >
            {reduced ? "Advance" : playing ? "Ⅱ Pause" : "▶ Play"}
          </button>
          <button
            disabled={step === walkthroughSteps.length - 1}
            onClick={() => {
              setStep((s) => s + 1);
              setPlaying(false);
            }}
          >
            Next →
          </button>
          <button
            onClick={() => {
              setStep(0);
              setPlaying(false);
            }}
          >
            ↻ Restart
          </button>
        </div>
        {reduced && (
          <p className="small">Reduced motion is enabled: advance manually.</p>
        )}
      </div>
      <div className="closing">
        <span className="eyebrow">THE IDEA TO TAKE WITH YOU</span>
        <h3>
          Learn the displacement.
          <br />
          Take the whole step.
        </h3>
        <p>
          MeanFlow turns an interval average into a learnable field, using a
          local identity to connect it to instantaneous velocity.
        </p>
        <div>
          <a
            className="primary-button"
            href={paperUrl()}
            target="_blank"
            rel="noreferrer"
          >
            Read the full paper ↗
          </a>
          <a
            className="text-link"
            href={authorsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Authors’ implementation ↗
          </a>
        </div>
      </div>
    </>
  );
}
