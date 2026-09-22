import { ParticleLab } from "../components/Particles";
import { AverageLab, EulerLab, FlowLab } from "../components/FlowLabs";
import {
  Callout,
  Checkpoint,
  DeepDive,
  Equation,
  MathText,
} from "../components/common";
export function Generation() {
  return (
    <>
      <p className="lead">
        An image generator starts with something easy to sample—random noise—and
        transforms it into something that looks like data. The interesting
        question is how many steps that transformation needs.
      </p>
      <div className="prose-columns">
        <p>
          A <b>sample</b> is one observation. A <b>distribution</b> describes
          where observations tend to fall. In the laboratory below, the data
          distribution has three clusters. Each point plays the role of a tiny,
          two-dimensional “image.”
        </p>
        <p>
          <b>Training</b> learns the transformation from examples.{" "}
          <b>Generation</b> uses that learned transformation on new noise. A
          model evaluation runs the network once; doing it hundreds of times
          costs more time than doing it once with the same network.
        </p>
      </div>
      <ParticleLab />
      <Callout title="A picture of the idea, not an image model">
        Every interactive simulation here is a small browser-based teaching
        example. The paper’s actual image outputs appear in Chapter 10. No
        trained generative model is downloaded or run.
      </Callout>
      <DeepDive title="Why noise can become a structured distribution">
        <p>
          A standard Gaussian prior places most points near the origin but has
          no preferred direction. A learned transformation transports
          probability mass: a dense region in the output means many noise
          samples arrive there. There is no fixed target image paired with each
          noise sample at generation time.
        </p>
        <p>
          Our example uses three equally weighted Gaussians with centers
          (−1.5,−0.8), (1.45,−0.8), and (0,1.5), each with standard deviation
          0.22. Its exact marginal velocity is tractable; image distributions
          require a learned approximation.
        </p>
      </DeepDive>
    </>
  );
}
export function Flow() {
  return (
    <>
      <p className="lead">
        Start with a data point <MathText tex="x" /> and an independent noise
        sample <MathText tex="\epsilon" />. Connect them with a straight line.
        Time tells us how much noise is in the mixture.
      </p>
      <div className="intro-equation">
        <MathText
          tex={String.raw`z_t=(1-t)x+t\epsilon,\qquad v_t=\epsilon-x`}
          block
        />
        <p>
          At t=0, z₀=x. At t=1, z₁=ε. The derivative vₜ points toward increasing
          time—toward noise.
        </p>
      </div>
      <FlowLab />
      <p>
        At the same position and time, different data–noise pairs can imply
        different arrows. A network that only sees the current point cannot know
        which pair produced it. Squared-error training learns their conditional
        expectation: the <b>marginal velocity</b>.
      </p>
      <Equation id={1} />
      <Equation id={2} />
      <Callout title="Straight training lines do not imply straight generation">
        Each sampled pair gives a straight interpolation. But generation follows
        the changing average of all compatible velocities. That trajectory can
        curve even if the network predicts the marginal field perfectly.
      </Callout>
      <DeepDive title="Calculate the toy marginal field">
        <p>
          Write a=1−t, data component mean μₖ, and data variance σ². Within
          component k, zₜ has mean aμₖ and variance q=a²σ²+t². The conditional
          expectation of ε−x is:
        </p>
        <MathText
          tex={String.raw`\mathbb E[v_t\mid z,k]=-\mu_k+\frac{t-a\sigma^2}{q}(z-a\mu_k)`}
          block
        />
        <p>
          Posterior weights are proportional to exp(−‖z−aμₖ‖²/(2q)), with equal
          component priors. Sum these component velocities using their
          normalized weights to get v(z,t). This is the analytic field used
          throughout the transport labs.
        </p>
        <p>
          The conditional Flow Matching loss regresses against ε−x. Its expected
          squared error differs from regression against the marginal mean by a
          conditional-variance term that does not depend on the predictor. Both
          therefore have the same minimizing predictor.
        </p>
        <p>
          The general paper schedule is zₜ=aₜx+bₜε, with vₜ=a′ₜx+b′ₜε. The
          straight schedule is the default used here.
        </p>
      </DeepDive>
    </>
  );
}
export function Euler() {
  return (
    <>
      <p className="lead">
        An instantaneous velocity tells you where to head right now. It does not
        tell you where a curved path will end.
      </p>
      <p>
        An ODE solver approximates a continuous path with discrete updates.{" "}
        <b>Euler’s method</b> follows the current arrow for an entire step
        before asking for another one. Larger steps save evaluations, but they
        can miss the bend.
      </p>
      <div className="intro-equation">
        <MathText
          tex={String.raw`z_{t_{i+1}}=z_{t_i}+(t_{i+1}-t_i)v(z_{t_i},t_i)`}
          block
        />
        <p>For generation, tᵢ₊₁ &lt; tᵢ. The time increment is negative.</p>
      </div>
      <EulerLab />
      <Checkpoint
        question="Why can a single Euler step miss the data?"
        options={[
          "The network must be inaccurate",
          "The true path itself can curve",
          "Noise cannot be transformed",
        ]}
        correct={1}
        explanation="Even an exact instantaneous field can produce a curved trajectory. A large Euler step introduces numerical integration error."
      />
      <DeepDive title="Two errors worth separating">
        <p>
          <b>Model approximation error</b> is the difference between a learned
          field and its ideal target. <b>Numerical integration error</b> is the
          error made when a solver approximates the trajectory of that field.
          The laboratory removes the first source by using an analytic marginal
          velocity, leaving the second visible.
        </p>
        <p>
          Higher-order solvers can reduce numerical error at the cost of
          additional field evaluations. One solver step is therefore not always
          one NFE. Here each Euler step uses exactly one evaluation; each RK4
          reference step uses four.
        </p>
      </DeepDive>
    </>
  );
}
export function Average() {
  return (
    <>
      <p className="lead">
        Instead of asking “which way now?”, ask “what velocity would cover the
        whole displacement?”
      </p>
      <p>
        Let t be the current time and r the destination time, with r≤t. The{" "}
        <b>average velocity</b> u divides the displacement along a trajectory by
        its time interval. The intermediate trajectory can bend; its endpoint
        displacement is still a single vector.
      </p>
      <Equation id={3} />
      <AverageLab />
      <p>
        The average depends on <em>both</em> endpoints in time. A short interval
        looks like a tangent. A long interval summarizes the movement across a
        larger piece of the path. Figure 3 in the paper illustrates this field
        at t=0.5, 0.7, and 1.0; the controls let you inspect all three.
      </p>
      <DeepDive title="The diagonal limit and interval additivity">
        <MathText tex={String.raw`\lim_{r\to t}u(z_t,r,t)=v(z_t,t)`} block />
        <p>
          As the interval shrinks, the secant approaches the tangent. This
          assumes the instantaneous field is continuous along the path. The
          expression with division by t−r is evaluated by its limit on the
          diagonal.
        </p>
        <MathText
          tex={String.raw`(t-r)u(z_t,r,t)=(s-r)u(z_s,r,s)+(t-s)u(z_t,s,t)`}
          block
        />
        <p>
          Displacements add across adjacent intervals. Notice the spatial
          arguments: the earlier piece starts from zₛ, not zₜ. This relation
          follows from the additivity of integrals, with no neural-network
          consistency rule added.
        </p>
        <p>
          For the rotating example, zᵣ=R(−1.8(t−r))zₜ and u=(zₜ−zᵣ)/(t−r). These
          exact formulas provide a clean check of the identity; the average is
          not an arithmetic mean of vectors evaluated at a fixed point.
        </p>
      </DeepDive>
    </>
  );
}
