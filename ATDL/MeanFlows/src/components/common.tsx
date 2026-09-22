import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import katex from "katex";
import { equations, paperUrl } from "../data/paper";
export const DepthContext = createContext<"story" | "math">("story");
export function MathText({
  tex,
  block = false,
}: {
  tex: string;
  block?: boolean;
}) {
  return (
    <span
      className={block ? "math-block" : "math-inline"}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, {
          throwOnError: false,
          displayMode: block,
          strict: "ignore",
          output: "htmlAndMathml",
        }),
      }}
    />
  );
}
export function Equation({
  id,
  explain = true,
}: {
  id: number;
  explain?: boolean;
}) {
  const key = useId();
  const eq = equations.find((e) => e.id === id)!;
  return (
    <figure className="equation" id={`eq-${id}-${key}`} data-equation={id}>
      <div>
        <MathText tex={eq.tex} block />
        <a
          href={paperUrl(eq.page)}
          target="_blank"
          rel="noreferrer"
          aria-label={`Equation ${id} in paper, page ${eq.page}`}
        >
          ({id})
        </a>
      </div>
      {explain && (
        <figcaption>
          <b>{eq.name}.</b> {eq.explanation}
        </figcaption>
      )}
    </figure>
  );
}
export function Source({ pages, label }: { pages: number[]; label?: string }) {
  return (
    <span className="source">
      {label || "In the paper"} ·{" "}
      {pages.map((p, i) => (
        <span key={p}>
          {i > 0 ? ", " : ""}
          <a href={paperUrl(p)} target="_blank" rel="noreferrer">
            p. {p} ↗
          </a>
        </span>
      ))}
    </span>
  );
}
export function DeepDive({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const depth = useContext(DepthContext),
    [open, setOpen] = useState(depth === "math");
  useEffect(() => setOpen(depth === "math"), [depth]);
  return (
    <details
      className="deep-dive"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        <span className="detail-icon">＋</span>
        {title}
        <span className="detail-level">DEEPER DIVE</span>
      </summary>
      <div>{children}</div>
    </details>
  );
}
export function Range({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  format = (x: number) => x.toFixed(2),
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (x: number) => string;
}) {
  const id = useId();
  return (
    <div className="range-control">
      <label htmlFor={id}>
        {label}
        <output>{format(value)}</output>
      </label>
      <input
        id={id}
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
export function Choice<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="choice" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          className={o === value ? "selected" : ""}
          aria-pressed={o === value}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
export function Callout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className="callout">
      <span>↳</span>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </aside>
  );
}
export function Checkpoint({
  question,
  options,
  correct,
  explanation,
}: {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}) {
  const [answer, setAnswer] = useState<number | null>(null);
  return (
    <div className="checkpoint">
      <span className="eyebrow">CHECK YOUR INTUITION</span>
      <h4>{question}</h4>
      <div>
        {options.map((o, i) => (
          <button
            key={o}
            aria-pressed={answer === i}
            className={answer === i ? "selected" : ""}
            onClick={() => setAnswer(i)}
          >
            {o}
          </button>
        ))}
      </div>
      {answer !== null && (
        <p role="status">
          <b>{answer === correct ? "Exactly." : "Take another look."}</b>{" "}
          {explanation}
        </p>
      )}
    </div>
  );
}
export function useVisible<T extends HTMLElement>() {
  const ref = useRef<T>(null),
    [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)"),
      listener = () => setReduced(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  return reduced;
}
export const fmt = (x: number) => (Number.isFinite(x) ? x.toFixed(3) : "—");
