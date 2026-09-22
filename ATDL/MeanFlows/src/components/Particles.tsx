import { useEffect, useRef, useState } from "react";
import type { Vec } from "../math/flow";
import { Range, useReducedMotion, useVisible } from "./common";
import { Legend } from "./plots";
export function useTrajectories(seed = 42) {
  const [paths, setPaths] = useState<Vec[][]>([]),
    id = useRef(0),
    worker = useRef<Worker | null>(null);
  useEffect(() => {
    worker.current = new Worker(
      new URL("../math/trajectories.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.current.onmessage = (e) => {
      if (e.data.id === id.current) setPaths(e.data.paths);
    };
    return () => worker.current?.terminate();
  }, []);
  useEffect(() => {
    setPaths([]);
    worker.current?.postMessage({ id: ++id.current, seed });
  }, [seed]);
  return paths;
}
export function HeroFlow() {
  const paths = useTrajectories();
  return (
    <div
      className="hero-flow"
      aria-label="Illustration of noise flowing toward three data clusters"
    >
      <svg viewBox="0 0 940 300" role="img">
        <title>
          A Gaussian cloud becomes three clusters; curves use the toy marginal
          flow with time spread horizontally for illustration.
        </title>
        <defs>
          <linearGradient id="flow-color">
            <stop stopColor="#b7a6ed" />
            <stop offset="1" stopColor="#cbe7ae" />
          </linearGradient>
          <radialGradient id="hero-glow">
            <stop stopColor="#5e8071" stopOpacity=".3" />
            <stop offset="1" stopColor="#22302d" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="680" cy="145" rx="230" ry="145" fill="url(#hero-glow)" />
        {paths.slice(0, 70).map((p, i) => (
          <path
            key={i}
            d={p
              .map(
                (v, j) =>
                  `${j ? "L" : "M"}${160 + (j / 128) * 620 + v[0] * 39},${147 - v[1] * 43}`,
              )
              .join(" ")}
            fill="none"
            stroke="url(#flow-color)"
            strokeWidth=".7"
            opacity=".12"
          />
        ))}
        {paths.map((p, i) => (
          <g key={i}>
            <circle
              cx={160 + p[0][0] * 39}
              cy={147 - p[0][1] * 43}
              r="1.8"
              fill="#b7a6ed"
              opacity=".8"
            />
            <circle
              cx={780 + p[128][0] * 39}
              cy={147 - p[128][1] * 43}
              r="2"
              fill="#cbe7ae"
              opacity=".85"
            />
          </g>
        ))}
        <path
          d="M320 155 Q480 38 631 135"
          fill="none"
          stroke="#80c8ba"
          strokeWidth="2"
        />
        <path
          d="M618 122 L632 136 L614 138"
          fill="none"
          stroke="#80c8ba"
          strokeWidth="2"
        />
        <text x="475" y="82" textAnchor="middle" fill="#b9d8c9" fontSize="13">
          learn the whole displacement
        </text>
        <text
          x="160"
          y="277"
          textAnchor="middle"
          fill="#b7a6ed"
          fontSize="12"
          letterSpacing="2"
        >
          GAUSSIAN NOISE
        </text>
        <text
          x="780"
          y="277"
          textAnchor="middle"
          fill="#cbe7ae"
          fontSize="12"
          letterSpacing="2"
        >
          DATA DISTRIBUTION
        </text>
        <text x="475" y="220" textAnchor="middle" fill="#a4b2ac" fontSize="12">
          one network evaluation
        </text>
      </svg>
      <div className="hero-flow-bottom">
        <span>01 — THE IDEA</span>
        <span>Learn where to go, over an entire interval.</span>
        <span>t = 1 → 0</span>
      </div>
    </div>
  );
}
export function ParticleLab() {
  const [seed, setSeed] = useState(42),
    paths = useTrajectories(seed),
    [t, setT] = useState(1),
    [playing, setPlaying] = useState(false),
    { ref, visible } = useVisible<HTMLDivElement>(),
    reduced = useReducedMotion(),
    canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!playing || !visible || reduced) return;
    let id: number,
      last = 0;
    const tick = (now: number) => {
      if (last) {
        const d = (now - last) / 5500;
        setT((t) => {
          if (t <= d) {
            setPlaying(false);
            return 0;
          }
          return t - d;
        });
      }
      last = now;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, visible, reduced]);
  useEffect(() => {
    const el = canvas.current;
    if (!el || !visible) return;
    const ctx = el.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    el.width = 700 * dpr;
    el.height = 320 * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 700, 320);
    const s = (1 - t) * 128,
      i = Math.min(127, Math.floor(s)),
      a = s - i;
    for (const p of paths) {
      const z: Vec = [
        p[i][0] * (1 - a) + p[i + 1][0] * a,
        p[i][1] * (1 - a) + p[i + 1][1] * a,
      ];
      ctx.beginPath();
      ctx.fillStyle = t > 0.5 ? "#b7a6ed" : "#cbe7ae";
      ctx.arc(350 + z[0] * 72, 160 - z[1] * 65, 2.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = "12px Inter";
    ctx.fillStyle = "#b8c5c0";
    ctx.fillText(`t = ${t.toFixed(2)}`, 22, 28);
    ctx.fillText(
      paths.length
        ? "260 samples · RK4 reference flow"
        : "Calculating trajectories…",
      22,
      303,
    );
  }, [paths, t, visible]);
  return (
    <div className="lab" ref={ref}>
      <div className="lab-heading">
        <span>LAB 01 / TRANSPORT A DISTRIBUTION</span>
        <span className="tag">Calculated toy example</span>
      </div>
      <canvas
        ref={canvas}
        className="particle-canvas"
        role="img"
        aria-label={`Gaussian mixture transport at time ${t.toFixed(2)}; 260 samples approach three data clusters as time decreases.`}
      />
      <div className="lab-controls">
        <button
          className="light-button"
          onClick={() => {
            if (reduced) {
              setT(t === 0 ? 1 : 0);
            } else {
              if (t === 0) setT(1);
              setPlaying(!playing);
            }
          }}
        >
          {reduced ? "Toggle noise / data" : playing ? "Ⅱ Pause" : "▶ Generate"}
        </button>
        <Range
          label="Time t · 1 noise → 0 data"
          value={t}
          onChange={(v) => {
            setPlaying(false);
            setT(v);
          }}
        />
        <button
          className="quiet-button"
          onClick={() => {
            setSeed((s) => s + 1);
            setT(1);
            setPlaying(false);
          }}
        >
          ↻ New noise
        </button>
      </div>
      <Legend />
      <p className="lab-note">
        A seeded Gaussian mixture, integrated numerically in your browser. These
        points are teaching samples, not generated images or neural-network
        inference.
      </p>
    </div>
  );
}
