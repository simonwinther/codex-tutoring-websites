import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Architecture } from "../components/Architecture";
import {
  Callout,
  Checkpoint,
  DeepDive,
  Equation,
  MathText,
  Range,
  useReducedMotion,
} from "../components/common";
import {
  GuidanceLab,
  TimeSamplerLab,
  TrainingLab,
} from "../components/TrainingLabs";
import {
  rotateAverage,
  rotateJvp,
  rotatePosition,
  rotateVelocity,
} from "../math/flow";
export function Identity() {
  const [step, setStep] = useState(0),
    [r, setR] = useState(0.2),
    reduced = useReducedMotion();
  const eqs = [3, 4, 5, 6, 7, 8],
    z = rotatePosition(0.8),
    u = rotateAverage(z, r, 0.8),
    v = rotateVelocity(z),
    du = rotateJvp(z, r, 0.8);
  return (
    <>
      <p className="lead">
        The definition contains an integral, which would be expensive to compute
        for every training example. Differentiating it gives a local relation we
        can train with.
      </p>
      <div className="derivation">
        <div
          className="derivation-tabs"
          role="group"
          aria-label="Derivation step"
        >
          {[
            "Define",
            "Multiply",
            "Differentiate",
            "Rearrange",
            "Chain rule",
            "JVP",
          ].map((s, i) => (
            <button
              key={s}
              aria-pressed={step === i}
              onClick={() => setStep(i)}
              className={step === i ? "selected" : ""}
            >
              <span>{i + 1}</span>
              {s}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: reduced ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reduced ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <Equation id={eqs[step]} />
          </motion.div>
        </AnimatePresence>
        <div className="derivation-geometry">
          <Range
            label="Identity interval start r (t=0.8)"
            value={r}
            onChange={setR}
            max={0.8}
          />
          <div className="identity-numbers">
            <span>
              average u<br />
              <b>({u.map((x) => x.toFixed(2)).join(", ")})</b>
            </span>
            <span>=</span>
            <span>
              instantaneous v<br />
              <b>({v.map((x) => x.toFixed(2)).join(", ")})</b>
            </span>
            <span>−</span>
            <span>
              (t−r) du/dt
              <br />
              <b>({du.map((x) => ((0.8 - r) * x).toFixed(2)).join(", ")})</b>
            </span>
          </div>
          <p>
            Computed on the same exact rotating trajectory as Chapter 4.
            Changing the interval changes the average and its derivative
            correction together.
          </p>
        </div>
        <div className="playback">
          <button onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            ← Previous
          </button>
          <span>{step + 1} / 6</span>
          <button onClick={() => setStep((s) => s + 1)} disabled={step === 5}>
            Next →
          </button>
        </div>
      </div>
      <Callout title="Hold r fixed when differentiating">
        The upper time t changes, and the spatial input zₜ moves with the flow.
        The lower time r is independent of t. If r moved as well, the Leibniz
        rule would add a lower-boundary term.
      </Callout>
      <DeepDive title="All steps in the derivation, together">
        {[4, 5, 6, 7, 8].map((id) => (
          <Equation key={id} id={id} />
        ))}
        <p>
          The fundamental theorem of calculus supplies v(zₜ,t) at the upper
          endpoint. Applying the product rule supplies u+(t−r)du/dt. This
          reasoning concerns the underlying continuous fields; no network
          appears yet.
        </p>
      </DeepDive>
      <DeepDive title="Appendix B.3: why the identity is also sufficient">
        <p>
          Taking a derivative can lose a constant. To go from the identity back
          to the integral definition, introduce the displacement field S:
        </p>
        <Equation id={23} />
        <p>
          The identity gives dS/dt=v along a trajectory, so integration implies
          equality up to constants.
        </p>
        <Equation id={24} />
        <p>
          At t=r, S=(t−r)u=0 for finite, regular u; the integral over an empty
          interval is also zero. Thus C₁=C₂, and S equals the integral. Dividing
          by t−r recovers Eq. 3 off the diagonal; continuity supplies its
          diagonal limit.
        </p>
        <p>
          Regularity matters. A singular term proportional to 1/(t−r) could hide
          a nonzero integration constant. A finite differentiable neural
          predictor excludes that behavior at the diagonal. If displacement S
          were parameterized directly, dS/dt=v would require an extra condition
          S(zᵣ,r,r)=0.
        </p>
      </DeepDive>
    </>
  );
}
export function Training() {
  return (
    <>
      <p className="lead">
        Learn the average velocity by asking the network to satisfy the
        identity. The target uses a derivative of the current predictor, then
        holds that target fixed for the update.
      </p>
      <p>
        A <b>partial derivative</b> changes one input. A <b>total derivative</b>{" "}
        follows all inputs that change together. Along this trajectory z moves
        at v, r stays fixed, and t advances at unit speed. Those changes form
        the tangent <b>(v,0,1)</b>.
      </p>
      <Equation id={8} />
      <p>
        A Jacobian-vector product, or <b>JVP</b>, computes that directional
        derivative without constructing the full Jacobian. Algorithm 1 evaluates
        the prediction and its JVP together.
      </p>
      <TrainingLab />
      <Equation id={9} />
      <Equation id={11} />
      <DeepDive title="From the marginal target to the sampled training signal">
        <Equation id={10} />
        <p>
          The ideal relation uses v(zₜ,t), the marginal mean over compatible
          pairs. The practical recipe substitutes the sampled velocity vₜ=ε−x,
          both in the leading term and in the JVP tangent. The correction is
          affine in this velocity for fixed network derivatives, so taking its
          conditional expectation recovers the marginal target.
        </p>
        <p>
          This is a stochastic target. Zero per-sample conditional loss is
          generally not attainable when compatible sample velocities differ. The
          paper’s zero-loss argument refers to satisfying the ideal field
          relation; it does not prove that finite optimization on image data
          finds an exact field.
        </p>
        <p>
          When t=r, the derivative correction vanishes. Training on this
          diagonal is exactly standard conditional Flow Matching. Off-diagonal
          examples teach the model how the average changes over an interval.
        </p>
      </DeepDive>
      <DeepDive title="Why stop-gradient saves computation">
        <p>
          The predictor appears on both sides of the regression. Stop-gradient
          treats the computed target as a constant during differentiation with
          respect to θ. The derivative is still evaluated in the forward
          training computation, but the optimizer does not differentiate through
          that derivative again.
        </p>
        <p>
          Appendix B.4 describes the JVP as forward-mode automatic
          differentiation. For B/4 on v4-8 TPUs in JAX, Flow Matching took 0.045
          seconds per iteration and MeanFlow took 0.052 seconds: approximately
          16% extra wall time. This is a particular implementation benchmark,
          not a universal overhead guarantee.
        </p>
        <p>
          For the affine laboratory, u=az+br+ct+d, so JVP=av+c and the detached
          squared-error gradient is 2(u−u_target)(z,r,t,1). Toggling detachment
          exposes the additional terms that would enter a full residual
          gradient.
        </p>
      </DeepDive>
      <Checkpoint
        question="What does the zero in the JVP tangent (v,0,1) mean?"
        options={[
          "The model has no dependence on r",
          "r is fixed along this derivative",
          "The average velocity is zero",
        ]}
        correct={1}
        explanation="The network may depend on r. Its input r simply does not change as we differentiate along t."
      />
    </>
  );
}
export function Model() {
  return (
    <>
      <p className="lead">
        MeanFlow changes what a network learns. On ImageNet, the paper keeps the
        familiar DiT Transformer blocks and gives them two time coordinates.
      </p>
      <Architecture />
      <Callout title="“From scratch” has a specific scope">
        The generative flow network is trained from scratch, without a
        pretrained flow teacher or distillation. The ImageNet pipeline still
        uses a pretrained VAE encoder and decoder.
      </Callout>
      <DeepDive title="Time embeddings, attention, and adaLN-Zero">
        <p>
          A positional embedding turns a scalar time into a vector of periodic
          features. For each time coordinate, a two-layer MLP transforms that
          embedding; the two outputs are summed. Class conditioning and these
          time features guide the Transformer.
        </p>
        <p>
          Self-attention mixes information among image patches. The feed-forward
          part transforms each token’s representation. Adaptive layer
          normalization uses the conditioning to modulate normalized features
          and residual gates. The “Zero” initialization starts those residual
          branches with zero contribution, supporting stable optimization.
        </p>
        <p>
          Internally, the paper favors (t,t−r). Externally the mathematical
          function is still u(z,r,t)=net(z,t,t−r). JVP must be taken through
          that wrapper. Along (v,0,1), both internal time t and interval t−r
          have tangent 1; changing the embedding does not change the
          mathematics.
        </p>
        <p>
          Table 4’s FLOPs describe the specified architecture. Neither the 2D
          plots nor their frame rate measure the image model’s real latency.
          Select Table 4 in the evidence browser for all optimizer, EMA,
          guidance, and sampler settings.
        </p>
      </DeepDive>
      <DeepDive title="CIFAR-10 uses a different network and training setup">
        <p>
          The unconditional CIFAR-10 experiment works directly on 32×32×3
          pixels, using a roughly 55M-parameter U-net developed from the
          score-model architecture cited by the paper. Its time embeddings for
          (t,t−r) are concatenated. It uses no EDM preconditioner.
        </p>
        <p>
          Adam: learning rate 0.0006, batch size 1,024, β=(0.9,0.999), dropout
          0.2, weight decay 0, EMA decay 0.99995. Training lasts 800K iterations
          with 10K warm-up. The sampler is lognorm(−2.0,2.0), the off-diagonal
          ratio is 75%, and adaptive-weight power p=0.75. Augmentation follows
          EDM with vertical flips and rotation disabled.
        </p>
        <p>
          The 2.92 FID result belongs to this setup, not the ImageNet latent
          Transformer. These differing configurations should not be mixed when
          comparing the two datasets.
        </p>
      </DeepDive>
    </>
  );
}
export function Guidance() {
  return (
    <>
      <p className="lead">
        The identity defines the learning problem. Time sampling, loss
        weighting, and guidance determine how the model practices it.
      </p>
      <p>
        Training can spend some examples on the diagonal r=t and others on
        intervals r&lt;t. A <b>logit-normal</b> sampler draws a normal random
        value, then applies the logistic function to place it between 0 and 1.
      </p>
      <TimeSamplerLab />
      <Equation id={22} />
      <DeepDive title="Appendix B.2: the gradient behind adaptive weighting">
        <p>
          For squared error L=‖Δ‖² and a powered loss Lᵞ, the derivative is
          γLᵞ⁻¹∂L/∂θ. This motivates a detached weight proportional to Lᵞ⁻¹,
          with p=1−γ. The practical form adds c&gt;0 to stabilize small errors.
        </p>
        <p>
          For p=0, the weight is 1 and the loss is ordinary squared error. At
          p=0.5 the gradient resembles Pseudo-Huber. At p=1, the implemented
          detached gradient behaves like a smoothed log-error objective; it must
          not be interpreted as differentiating a constant L⁰. In particular,
          differentiating wL through w would give a different algorithm.
        </p>
        <p>
          Table 1 reports discrete tested settings. The best B/4 ablation uses
          p=1, lognorm(−0.4,1.0), and 25% off-diagonal samples. These
          observations do not establish a universally optimal recipe.
        </p>
      </DeepDive>
      <h3>Guidance becomes part of the learned field.</h3>
      <p>
        A class label c requests a category. A class-conditional velocity
        differs from the unconditional velocity that averages over compatible
        categories. <b>Classifier-free guidance (CFG)</b> strengthens the
        class-dependent direction. With ω&gt;1, it extrapolates beyond the
        class-conditional field.
      </p>
      <Equation id={13} />
      <GuidanceLab />
      <DeepDive title="Equations 13–19: derive one-NFE guidance">
        <Equation id={14} />
        <p>
          Apply the MeanFlow definition to the new guided instantaneous field.
          Its trajectories induce a guided average field, so the same identity
          holds:
        </p>
        <Equation id={15} />
        <p>
          At the diagonal, average and instantaneous velocity agree. Using the
          paper’s class marginalization, the unconditional guided field equals
          the original unconditional field. This lets an unconditional diagonal
          prediction supply that term:
        </p>
        <Equation id={16} />
        <Equation id={17} />
        <Equation id={18} />
        <Equation id={19} />
        <p>
          Use the modified velocity ṽ in both the target and the JVP. The
          trained network then directly predicts a guided average. At generation
          time no separate conditional/unconditional combination is needed, so
          the flow prediction remains 1 NFE.
        </p>
      </DeepDive>
      <DeepDive title="Appendix B.1: mix conditional and unconditional diagonal predictions">
        <Equation id={20} />
        <p>
          On the diagonal, uᶜᶠᵍ(·|c)=vᶜᶠᵍ(·|c). Move its κ multiple to the left.
          Then:
        </p>
        <MathText
          tex={String.raw`(1-\kappa)v^{\rm cfg}=\omega v(\cdot\mid c)+(1-\omega-\kappa)v(\cdot),\qquad \omega'=\frac{\omega}{1-\kappa}`}
          block
        />
        <p>
          Dividing by 1−κ gives ordinary CFG with effective scale ω′. This
          derivation assumes κ≠1. Replacing fields with network predictions and
          the sampled pair produces the practical rule:
        </p>
        <Equation id={21} />
        <p>
          Table 5 fixes ω′=2 and varies κ, setting ω=(1−κ)ω′. Its five FIDs are
          20.15, 19.15, 19.10, 18.63, and 19.17 for κ=0, 0.5, 0.8, 0.9, and
          0.95. Table 1f uses κ=0 throughout. These are separate ablations.
        </p>
      </DeepDive>
      <DeepDive title="Class dropout and training-time guidance intervals">
        <p>
          The paper drops the class condition with 10% probability to teach
          unconditional predictions. This is a training exposure mechanism, not
          an instruction to randomly discard 10% of generated images.
        </p>
        <p>
          Table 4 applies CFG only for training samples whose t lies in a
          specified interval: B/2 and M/2 use [0,1], L/2 uses [0,0.8], XL/2 uses
          [0,0.75], and XL/2+ uses [0.3,0.8]. The resulting network is still
          queried once for one-step generation. The interval is not a
          requirement to run multiple guidance evaluations at inference.
        </p>
      </DeepDive>
    </>
  );
}
