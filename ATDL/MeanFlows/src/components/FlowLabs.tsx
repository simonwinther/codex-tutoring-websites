import { useMemo, useState } from "react";
import {
  add,
  centers,
  integrate,
  interpolate,
  mixtureVelocity,
  mul,
  norm,
  rotateAverage,
  rotateJvp,
  rotatePosition,
  rotateVelocity,
  rotation,
  rotationRate,
  sub,
  type Vec,
} from "../math/flow";
import { Choice, fmt, Range } from "./common";
import { Arrow, colors, Dot, DragPoint, Legend, pathD, Plot } from "./plots";
export function FlowLab() {
  const [t, setT] = useState(0.55),
    [x, setX] = useState<Vec>([1.45, -0.8]),
    [e, setE] = useState<Vec>([-1.3, 1.4]),
    [mode, setMode] = useState("One sampled pair");
  const z = interpolate(x, e, t),
    v = sub(e, x),
    marginal = mixtureVelocity(z, t);
  const path = useMemo(() => integrate(mixtureVelocity, e), [e]);
  return (
    <div className="lab">
      <div className="lab-heading">
        <span>LAB 02 / A POINT HAS MANY POSSIBLE HISTORIES</span>
        <span className="tag">Figure 2 · reinterpreted</span>
      </div>
      <Choice
        label="Flow view"
        options={["One sampled pair", "Marginal field"]}
        value={mode}
        onChange={setMode}
      />
      <Plot label="Draggable interpolation endpoints with conditional and marginal velocities">
        {mode === "Marginal field" && (
          <>
            {Array.from({ length: 7 }, (_, i) =>
              Array.from({ length: 5 }, (_, j) => {
                const p: Vec = [(i - 3) * 0.8, (j - 2) * 0.8];
                const vel = mixtureVelocity(p, t);
                return (
                  <Arrow
                    key={`${i}-${j}`}
                    from={p}
                    to={add(p, mul(vel, 0.12))}
                    color="#4c7770"
                  />
                );
              }),
            )}
            <path
              d={pathD(path)}
              fill="none"
              stroke={colors.data}
              strokeWidth="2"
              strokeDasharray="5 4"
            />
          </>
        )}
        <path
          d={pathD([x, e])}
          fill="none"
          stroke="#667570"
          strokeWidth="1.5"
        />
        {mode === "Marginal field" &&
          t > 0.02 &&
          centers.map((c, i) => (
            <Arrow
              key={i}
              from={z}
              to={add(z, mul(sub(z, c), 0.22 / t))}
              color="#796b59"
            />
          ))}
        <Arrow
          from={z}
          to={add(z, mul(v, 0.35))}
          color={colors.instant}
          label="vₜ"
        />
        {mode === "Marginal field" && (
          <Arrow
            from={z}
            to={add(z, mul(marginal, 0.35))}
            color={colors.average}
            label="v(zₜ,t)"
          />
        )}
        <DragPoint point={x} onChange={setX} label="data x" />
        <DragPoint
          point={e}
          onChange={setE}
          label="noise ε"
          color={colors.noise}
        />
        <Dot point={z} label="zₜ" color="#fff" />
      </Plot>
      <div className="lab-controls">
        <Range label="Interpolation time t" value={t} onChange={setT} />
        <span className="readout">
          zₜ = ({fmt(z[0])}, {fmt(z[1])})<br />
          vₜ = ({fmt(v[0])}, {fmt(v[1])})
        </span>
      </div>
      <Legend />
      <p className="lab-note">
        Drag the endpoints or focus them and use arrow keys.{" "}
        {mode === "One sampled pair"
          ? "The orange arrow is ε−x for this pair. Its straight path supplies a training signal."
          : "The teal arrow is the analytically computed marginal velocity. Faint arrows show alternative compatible pairs (not their posterior weights); the dashed curve is generation from ε."}
      </p>
    </div>
  );
}
export function EulerLab() {
  const [steps, setSteps] = useState(1),
    [start, setStart] = useState<Vec>([0.55, 1.35]);
  const reference = useMemo(
    () => integrate(mixtureVelocity, start, 1, 0, 1024),
    [start],
  );
  const paths = useMemo(
    () =>
      [1, 2, 4, 16, 64].map((n) => ({
        n,
        path: integrate(mixtureVelocity, start, 1, 0, n, "euler"),
      })),
    [start],
  );
  const chosen = paths.find((p) => p.n === steps)!;
  const end = reference.at(-1)!;
  return (
    <div className="lab">
      <div className="lab-heading">
        <span>LAB 03 / SAME FIELD, DIFFERENT STEP SIZES</span>
        <span className="tag">Numerical integration</span>
      </div>
      <Choice
        label="Euler steps"
        options={[1, 2, 4, 16, 64]}
        value={steps}
        onChange={setSteps}
      />
      <Plot
        label={`Euler trajectory with ${steps} evaluations and a Runge–Kutta reference`}
      >
        {centers.map((c, i) => (
          <circle
            key={i}
            cx={280 + c[0] * 66}
            cy={170 - c[1] * 66}
            r="25"
            fill={colors.data}
            opacity=".08"
          />
        ))}
        <path
          d={pathD(reference)}
          fill="none"
          stroke={colors.data}
          strokeWidth="2.5"
        />
        <path
          d={pathD(chosen.path)}
          fill="none"
          stroke={colors.instant}
          strokeWidth="2"
        />
        {chosen.path.map((p, i) => (
          <Dot key={i} point={p} color={colors.instant} />
        ))}
        <Dot point={end} label="reference" />
        <DragPoint
          point={start}
          onChange={setStart}
          label="start ε"
          color={colors.noise}
        />
      </Plot>
      <div className="metric-strip">
        <div>
          <span>Euler steps</span>
          <strong>{steps}</strong>
        </div>
        <div>
          <span>Field evaluations</span>
          <strong>{steps}</strong>
        </div>
        <div>
          <span>Endpoint error</span>
          <strong>{fmt(norm(sub(chosen.path.at(-1)!, end)))}</strong>
        </div>
      </div>
      <details className="chart-data">
        <summary>Read the comparison as a table</summary>
        <table>
          <caption>
            Euclidean distance to a 1,024-step RK4 reference (4,096 field
            evaluations)
          </caption>
          <thead>
            <tr>
              <th>Euler steps / NFE</th>
              <th>Endpoint error</th>
            </tr>
          </thead>
          <tbody>
            {paths.map((p) => (
              <tr key={p.n}>
                <td>{p.n}</td>
                <td>{fmt(norm(sub(p.path.at(-1)!, end)))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="lab-note">
        Green: reference path. Orange: Euler. Both use the same exact toy
        marginal field. The reference is a high-accuracy numerical solution, not
        a closed-form ground truth.
      </p>
    </div>
  );
}
export function AverageLab({ compact = false }: { compact?: boolean }) {
  const [r, setR] = useState(0.15),
    [t, setT] = useState(0.85);
  const zr = rotatePosition(r),
    zt = rotatePosition(t),
    u = rotateAverage(zt, r, t),
    v = rotateVelocity(zt),
    s = (r + t) / 2,
    zs = rotatePosition(s);
  const residual = norm(
    sub(
      mul(u, t - r),
      add(
        mul(rotateAverage(zs, r, s), s - r),
        mul(rotateAverage(zt, s, t), t - s),
      ),
    ),
  );
  const pointToTime = (p: Vec) =>
    Math.max(0, Math.min(1, Math.atan2(p[1], p[0]) / rotationRate));
  return (
    <div className="lab">
      <div className="lab-heading">
        <span>LAB 04 / TANGENT, AVERAGE, DISPLACEMENT</span>
        <span className="tag">Figure 3 · exact toy geometry</span>
      </div>
      <Plot label="Rotating flow: orange tangent, teal average, and displacement between two draggable times">
        <path
          d={pathD(
            Array.from({ length: 101 }, (_, i) => rotatePosition(i / 100)),
          )}
          stroke="#697d75"
          fill="none"
          strokeWidth="2"
        />
        <path
          d={pathD(
            Array.from({ length: 51 }, (_, i) =>
              rotatePosition(r + ((t - r) * i) / 50),
            ),
          )}
          stroke={colors.data}
          fill="none"
          strokeWidth="3"
        />
        <Arrow
          from={zt}
          to={add(zt, mul(v, 0.45))}
          color={colors.instant}
          label="v"
        />
        <Arrow
          from={zt}
          to={add(zt, mul(u, 0.45))}
          color={colors.average}
          label="u"
        />
        <Arrow from={zr} to={zt} color="#d4dfd5" label="(t−r)u" />
        <DragPoint
          point={zr}
          onChange={(p) => setR(Math.min(t, pointToTime(p)))}
          label="r"
          color={colors.noise}
        />
        <DragPoint
          point={zt}
          onChange={(p) => setT(Math.max(r, pointToTime(p)))}
          label="t"
        />
        <Dot point={zs} label="s" color="#94a59c" />
      </Plot>
      <div className="lab-controls">
        <Range label="Lower time r" value={r} max={t} onChange={setR} />
        <Range label="Upper time t" value={t} min={r} onChange={setT} />
        <button className="quiet-button" onClick={() => setR(t)}>
          Set r = t
        </button>
      </div>
      <div className="metric-strip">
        <div>
          <span>Average u</span>
          <strong className="vector">
            ({fmt(u[0])}, {fmt(u[1])})
          </strong>
        </div>
        <div>
          <span>Displacement magnitude</span>
          <strong>{fmt(norm(mul(u, t - r)))}</strong>
        </div>
        <div>
          <span>‖u − v‖</span>
          <strong>{fmt(norm(sub(u, v)))}</strong>
        </div>
      </div>
      {!compact && (
        <>
          <p className="lab-note">
            Exact rotating field v(z)=1.8Jz, where J turns a vector 90°. Arrows
            u and v share scale 0.45; the displacement arrow uses its actual
            length. The chord is parallel to u. At r=t it vanishes and u=v.
          </p>
          <details className="chart-data">
            <summary>Verify interval additivity and the derivative</summary>
            <p>
              Split at s = {fmt(s)}. The sum of displacements over [r,s] and
              [s,t] equals the full displacement. Residual:{" "}
              {residual.toExponential(2)}.
            </p>
            <p>
              Total derivative du/dt = (
              {rotateJvp(zt, r, t).map(fmt).join(", ")}). The identity residual
              is{" "}
              {norm(
                sub(u, sub(v, mul(rotateJvp(zt, r, t), t - r))),
              ).toExponential(2)}
              .
            </p>
          </details>
        </>
      )}
    </div>
  );
}
export function SamplingLab() {
  const [steps, setSteps] = useState(1),
    [bias, setBias] = useState(0.08),
    [progress, setProgress] = useState(0);
  const start: Vec = [-0.35, 1.45];
  const points = useMemo(() => {
    let z = start;
    const p = [z];
    for (let i = 0; i < steps; i++) {
      const t = 1 - i / steps,
        r = 1 - (i + 1) / steps;
      const u = add(rotateAverage(z, r, t), [bias, 0]);
      z = sub(z, mul(u, t - r));
      p.push(z);
    }
    return p;
  }, [steps, bias]);
  const exact = rotation(start, -rotationRate);
  return (
    <div className="lab">
      <div className="lab-heading">
        <span>LAB 09 / GO BACKWARD IN TIME</span>
        <span className="tag">Exact toy average + controlled bias</span>
      </div>
      <Choice
        label="Sampling steps"
        options={[1, 2, 4]}
        value={steps}
        onChange={(v) => {
          setSteps(v);
          setProgress(0);
        }}
      />
      <Plot label="Reverse-time sampling with a controlled average-velocity approximation error">
        <path
          d={pathD(
            Array.from({ length: 101 }, (_, i) =>
              rotation(start, (-rotationRate * i) / 100),
            ),
          )}
          fill="none"
          stroke="#6e817b"
          strokeDasharray="5 4"
        />
        <path
          d={pathD(points.slice(0, progress + 1))}
          fill="none"
          stroke={colors.average}
          strokeWidth="2.5"
        />
        {points.slice(0, progress + 1).map((p, i) => (
          <Dot
            key={i}
            point={p}
            color={i === 0 ? colors.noise : colors.average}
            label={`t=${(1 - i / steps).toFixed(2)}`}
          />
        ))}
        <Dot point={exact} label="exact destination" />
      </Plot>
      <div className="lab-controls">
        <button
          className="light-button"
          onClick={() => setProgress((p) => (p === steps ? 0 : p + 1))}
        >
          {progress === steps ? "↻ Restart" : "Take a step →"}
        </button>
        <Range
          label="Average-prediction bias"
          min={0}
          max={0.5}
          value={bias}
          onChange={setBias}
        />
      </div>
      <div className="metric-strip">
        <div>
          <span>Evaluations taken</span>
          <strong>
            {progress} / {steps}
          </strong>
        </div>
        <div>
          <span>Final error with this bias</span>
          <strong>{fmt(norm(sub(points.at(-1)!, exact)))}</strong>
        </div>
      </div>
      <p className="lab-note">
        This example computes an exact average analytically, then adds a fixed
        horizontal error to illustrate model approximation. It does not run a
        trained image model. With zero bias, every step count reaches the exact
        endpoint.
      </p>
    </div>
  );
}
