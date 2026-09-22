import { useMemo, useState } from "react";
import {
  affine,
  effectiveGuidance,
  guidedVelocity,
  initialParams,
  lossWeight,
  sampleTimes,
  rng,
  gaussian,
  trainingStep,
  type Params,
} from "../math/flow";
import { Choice, fmt, MathText, Range } from "./common";
import { Arrow, colors, Plot } from "./plots";
const trainingLines = [
  "Sample x, ε and ordered times r ≤ t",
  "Interpolate z = (1−t)x + tε; v = ε−x",
  "Evaluate uθ and JVPθ with tangent (v, 0, 1)",
  "Construct u_target = v − (t−r) JVPθ",
  "Detach the target; calculate squared error",
  "Differentiate the prediction; update θ",
];
export function TrainingLab() {
  const [params, setParams] = useState<Params>(initialParams),
    [r, setR] = useState(0.2),
    [t, setT] = useState(0.75),
    [x, setX] = useState(0.8),
    [e, setE] = useState(-0.6),
    [step, setStep] = useState(0),
    [detached, setDetached] = useState(true),
    [updates, setUpdates] = useState(0),
    [last, setLast] = useState(""),
    [seed, setSeed] = useState(80);
  const calc = trainingStep(params, x, e, r, t);
  const derivative = [calc.z, r, t, 1].map(
    (q, i) => q + (detached ? 0 : (t - r) * [calc.velocity, 0, 1, 0][i]),
  );
  const draw = () => {
    const random = rng(seed),
      times = sampleTimes(seed, 1, "logit")[0];
    setX(random() < 0.5 ? -0.8 : 0.8);
    setE(gaussian(random));
    setR(times.r);
    setT(times.t);
    setSeed(seed + 1);
    setStep(0);
    setLast("");
  };
  const update = () => {
    const next = params.map(
      (p, i) => p - 0.04 * 2 * calc.error * derivative[i],
    ) as Params;
    setParams(next);
    setUpdates((n) => n + 1);
    setStep(5);
    setLast(
      `Update ${updates + 1}: frozen-target loss ${fmt(calc.loss)} → ${fmt((affine(next, calc.z, r, t) - calc.target) ** 2)}. The values above now show the next target, recomputed using the updated parameters.`,
    );
  };
  return (
    <div className="lab training-lab">
      <div className="lab-heading">
        <span>LAB 06 / ALGORITHM 1, WITH REAL NUMBERS</span>
        <span className="tag">Illustrative affine regression</span>
      </div>
      <div className="training-layout">
        <ol className="algorithm">
          {trainingLines.map((line, i) => (
            <li className={step === i ? "active" : ""} key={line}>
              <button onClick={() => setStep(i)}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {line}
              </button>
            </li>
          ))}
        </ol>
        <div className="training-values" aria-live="polite">
          <span className="eyebrow">{trainingLines[step]}</span>
          <MathText tex={String.raw`u_\theta(z,r,t)=az+br+ct+d`} block />
          {step === 0 && (
            <p>
              x = {fmt(x)}, ε = {fmt(e)}
              <br />r = {fmt(r)}, t = {fmt(t)}
            </p>
          )}
          {step === 1 && (
            <p>
              z = {fmt(calc.z)}
              <br />v = {fmt(calc.velocity)}
            </p>
          )}
          {step === 2 && (
            <p>
              uθ = {fmt(calc.u)}
              <br />
              JVP = av + c = {fmt(calc.jvp)}
            </p>
          )}
          {step === 3 && (
            <p>
              u_target = {fmt(calc.velocity)} − {fmt(t - r)} × {fmt(calc.jvp)}
              <br />
              <strong>{fmt(calc.target)}</strong>
            </p>
          )}
          {step === 4 && (
            <p>
              error = {fmt(calc.error)}
              <br />
              loss = error² = {fmt(calc.loss)}
              <br />
              target gradient:{" "}
              {detached ? "zero (detached)" : "included (comparison mode)"}
            </p>
          )}
          {step === 5 && (
            <p>
              ∇θ L = (
              {derivative.map((q) => fmt(2 * calc.error * q)).join(", ")})<br />
              θ ← θ − 0.04 ∇θ L<br />
              Updates applied: {updates}
            </p>
          )}
          <div className="parameter-readout">
            θ = ({params.map(fmt).join(", ")})
          </div>
        </div>
      </div>
      <div className="control-grid">
        <Range
          label="Training data x"
          value={x}
          min={-1.5}
          max={1.5}
          onChange={setX}
        />
        <Range
          label="Noise ε"
          value={e}
          min={Math.min(-1.5, e)}
          max={Math.max(1.5, e)}
          onChange={setE}
        />
        <Range label="Training r" value={r} max={t} onChange={setR} />
        <Range label="Training t" value={t} min={r} onChange={setT} />
      </div>
      <div className="lab-controls">
        <button className="quiet-button" onClick={draw}>
          Draw new example
        </button>
        <button
          className="quiet-button"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          ← Previous
        </button>
        <button
          className="light-button"
          onClick={() => (step === 5 ? update() : setStep((s) => s + 1))}
        >
          {step === 5 ? "Apply parameter update" : "Next calculation →"}
        </button>
        <button
          className="quiet-button"
          onClick={() => {
            setParams(initialParams);
            setUpdates(0);
            setStep(0);
            setLast("");
          }}
        >
          Reset predictor
        </button>
        <label className="check-label">
          <input
            type="checkbox"
            checked={detached}
            onChange={(ev) => setDetached(ev.target.checked)}
          />
          Detach target
        </label>
      </div>
      {last && (
        <p className="lab-note" role="status">
          {last}
        </p>
      )}
      <p className="lab-note">
        The paper uses a large neural network. This scalar affine predictor
        makes all derivatives explicit: ∂zu=a, ∂ru=b, ∂tu=c.{" "}
        {detached
          ? "The target is held constant during each update."
          : "Comparison mode differentiates through the target; this is not Algorithm 1. Notice the gradient changes."}{" "}
        A lower frozen-target loss does not guarantee that the next self-updated
        target has lower loss.
      </p>
    </div>
  );
}
export function TimeSamplerLab() {
  const [kind, setKind] = useState<"uniform" | "logit">("logit"),
    [mu, setMu] = useState(-0.4),
    [sd, setSd] = useState(1),
    [ratio, setRatio] = useState(0.25),
    [power, setPower] = useState(1),
    [error, setError] = useState(0.5);
  const points = useMemo(
    () => sampleTimes(12, 400, kind, mu, sd, ratio),
    [kind, mu, sd, ratio],
  );
  return (
    <div className="lab">
      <div className="lab-heading">
        <span>LAB 08A / WHERE DOES THE MODEL PRACTICE?</span>
        <span className="tag">Seeded samples</span>
      </div>
      <Choice
        label="Time distribution"
        options={["uniform", "logit"] as const}
        value={kind}
        onChange={setKind}
      />
      <div className="sampler-layout">
        <svg
          viewBox="0 0 350 310"
          role="img"
          aria-label={`400 sampled time pairs, ${Math.round(ratio * 100)} percent off-diagonal in expectation`}
        >
          <path
            d="M45 270 L305 270 L305 10 Z"
            fill="#31413a"
            stroke="#64756e"
          />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={45 + 260 * p.t}
              cy={270 - 260 * p.r}
              r="2.4"
              fill={p.r === p.t ? colors.noise : colors.data}
              opacity=".65"
            />
          ))}
          <text x="170" y="298" fill="#d7e1db" fontSize="12">
            upper time t →
          </text>
          <text
            transform="translate(17 170) rotate(-90)"
            fill="#d7e1db"
            fontSize="12"
          >
            lower time r →
          </text>
          <text x="60" y="40" fill={colors.noise} fontSize="12">
            diagonal r = t
          </text>
        </svg>
        <div>
          <Range
            label="Off-diagonal proportion"
            value={ratio}
            onChange={setRatio}
            format={(n) => `${Math.round(n * 100)}%`}
          />
          <Range
            label="Logit-normal mean μ"
            value={mu}
            onChange={setMu}
            min={-2}
            max={2}
            step={0.1}
          />
          <Range
            label="Logit-normal deviation σ"
            value={sd}
            onChange={setSd}
            min={0.2}
            max={2}
            step={0.1}
          />
          <p className="lab-note">
            Draw two times, order them, then set r=t for the diagonal portion.
            The plotted count varies around the requested proportion. Mean and
            deviation affect the logit-normal sampler only.
          </p>
        </div>
      </div>
      <div className="weight-lab">
        <Range
          label="Squared-loss weighting power p"
          value={power}
          onChange={setPower}
          min={0}
          max={2}
          step={0.05}
        />
        <Range
          label="Regression error Δ"
          value={error}
          onChange={setError}
          min={0}
          max={2}
        />
        <p>
          w = <b>{fmt(lossWeight(error, power))}</b>
          <br />
          sg(w)Δ² = <b>{fmt(lossWeight(error, power) * error * error)}</b>
        </p>
      </div>
      <p className="lab-note">
        Stabilizer c = 0.001 keeps the weight finite, including at zero error.
        These continuous controls show formulas, not interpolated FID ablations.
      </p>
    </div>
  );
}
export function GuidanceLab() {
  const [omega, setOmega] = useState(1),
    [kappa, setKappa] = useState(0.5),
    [v, setV] = useState(1.2),
    [uncond, setUncond] = useState(0.3),
    [cond, setCond] = useState(1.7),
    [time, setTime] = useState(0.6),
    [low, setLow] = useState(0),
    [high, setHigh] = useState(0.8),
    [drop, setDrop] = useState(false);
  const enabled = time >= low && time <= high && !drop;
  const vel = enabled ? guidedVelocity(v, uncond, cond, omega, kappa) : v;
  const calc = trainingStep(initialParams, 0.8, -0.6, 0.2, 0.75, 0.04, vel);
  return (
    <div className="lab">
      <div className="lab-heading">
        <span>LAB 08B / GUIDANCE CHANGES THE TRAINING TARGET</span>
        <span className="tag">Illustrative vector slice</span>
      </div>
      <Plot label="Horizontal vector slice showing sample, unconditional, and guided velocities">
        <Arrow
          from={[-2.4, 0.9]}
          to={[-2.4 + v, 0.9]}
          color={colors.instant}
          label={`sample vₜ = ${fmt(v)}`}
        />
        <Arrow
          from={[-2.4, 0]}
          to={[-2.4 + uncond, 0]}
          color={colors.noise}
          label={`unconditional = ${fmt(uncond)}`}
        />
        <Arrow
          from={[-2.4, -0.9]}
          to={[-2.4 + vel, -0.9]}
          color={colors.average}
          label={`modified ṽ = ${fmt(vel)}`}
        />
      </Plot>
      <div className="control-grid">
        <Range
          label="Guidance coefficient ω"
          value={omega}
          onChange={setOmega}
          min={0.1}
          max={3}
          step={0.1}
        />
        <Range
          label="Mixing κ"
          value={kappa}
          onChange={setKappa}
          max={0.95}
          step={0.05}
        />
        <Range
          label="Sample velocity vₜ"
          value={v}
          onChange={setV}
          min={-0.5}
          max={2}
        />
        <Range
          label="Unconditional diagonal output"
          value={uncond}
          onChange={setUncond}
          min={-0.5}
          max={2}
        />
        <Range
          label="Class-conditional diagonal output"
          value={cond}
          onChange={setCond}
          min={-0.5}
          max={2}
        />
        <Range
          label="Guidance evaluation time"
          value={time}
          onChange={setTime}
        />
        <Range
          label="Guidance interval start"
          value={low}
          max={high}
          onChange={setLow}
        />
        <Range
          label="Guidance interval end"
          value={high}
          min={low}
          onChange={setHigh}
        />
      </div>
      <label className="check-label">
        <input
          type="checkbox"
          checked={drop}
          onChange={(e) => setDrop(e.target.checked)}
        />
        Illustrate a dropped class (10% probability in paper training)
      </label>
      <div className="metric-strip">
        <div>
          <span>Effective scale ω′</span>
          <strong>{fmt(effectiveGuidance(omega, kappa))}</strong>
        </div>
        <div>
          <span>Guidance active?</span>
          <strong>{enabled ? "Yes" : "No"}</strong>
        </div>
        <div>
          <span>Illustrative target</span>
          <strong>{fmt(calc.target)}</strong>
        </div>
      </div>
      <p className="lab-note">
        The modified velocity is used in both places: u_target = ṽ − 0.55(0.3ṽ +
        0.1), using the affine predictor from Chapter 6. Changing guidance
        changes its target and JVP direction. With guidance inactive, this
        illustrative batch uses the sample velocity. Intermediate network
        predictions need not satisfy the exact field identity.
      </p>
    </div>
  );
}
