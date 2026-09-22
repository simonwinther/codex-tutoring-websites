import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  chapters,
  equations,
  glossary,
  paperUrl,
  authorsUrl,
} from "./data/paper";
import { coverage } from "./data/coverage";
import { DepthContext, Source } from "./components/common";
import { HeroFlow } from "./components/Particles";
import { Generation, Flow, Euler, Average } from "./chapters/Foundations";
import { Identity, Training, Model, Guidance } from "./chapters/Method";
import {
  Sampling,
  Evidence,
  Perspective,
  Walkthrough,
} from "./chapters/Results";
const content: ComponentType[] = [
  Generation,
  Flow,
  Euler,
  Average,
  Identity,
  Training,
  Model,
  Guidance,
  Sampling,
  Evidence,
  Perspective,
  Walkthrough,
];
const read = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Reading remains available without storage. */
  }
};
export default function App() {
  const [active, setActive] = useState("generation"),
    [menu, setMenu] = useState(false),
    [depth, setDepth] = useState<"story" | "math">(() =>
      read("meanflow-depth", "story") === "math" ? "math" : "story",
    ),
    [resume] = useState(() => read("meanflow-chapter", "")),
    [showResume, setShowResume] = useState(true),
    [panel, setPanel] = useState<"glossary" | "map" | "sources" | null>(null),
    [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    write("meanflow-depth", depth);
  }, [depth]);
  useEffect(() => {
    let pending = 0;
    const update = () => {
      pending = 0;
      let current = "generation";
      for (const chapter of chapters) {
        const el = document.getElementById(chapter.id);
        if (el && el.getBoundingClientRect().top < 250) current = chapter.id;
      }
      setActive(current);
      if (window.scrollY > 150) write("meanflow-chapter", current);
    };
    const scroll = () => {
      if (!pending) pending = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", scroll);
      cancelAnimationFrame(pending);
    };
  }, []);
  useEffect(() => {
    const hash = () => setMenu(false);
    window.addEventListener("hashchange", hash);
    if (location.hash)
      setTimeout(
        () => document.getElementById(location.hash.slice(1))?.scrollIntoView(),
        150,
      );
    return () => window.removeEventListener("hashchange", hash);
  }, []);
  useEffect(() => {
    if (panel) {
      setQuery("");
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [panel]);
  const changeDepth = (value: "story" | "math") => {
    const chapter = active,
      shouldRestore = window.scrollY > 200;
    setDepth(value);
    if (shouldRestore)
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document
            .getElementById(chapter)
            ?.scrollIntoView({ behavior: "instant" }),
        ),
      );
  };
  const current = chapters.findIndex((c) => c.id === active);
  const nav = (
    <>
      <a
        className="brand"
        href="#top"
        onClick={() => setMenu(false)}
        aria-label="MeanFlow, back to beginning"
      >
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <path d="M3 22C12 0 24 35 33 13M3 29C12 7 24 42 33 20M3 15C12 -7 24 28 33 6" />
        </svg>
        <span>
          MeanFlow<span>AN EXPLORABLE PAPER</span>
        </span>
      </a>
      <div className="nav-label">
        THE JOURNEY <span>12 CHAPTERS</span>
      </div>
      <nav aria-label="Chapters">
        {chapters.map((c, i) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            aria-current={active === c.id ? "location" : undefined}
            onClick={() => {
              setMenu(false);
              write("meanflow-chapter", c.id);
            }}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {c.short}
            {active === c.id && <i />}
          </a>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button
          onClick={() => {
            setPanel("map");
            setMenu(false);
          }}
        >
          ⌘ <span>Concept map</span> ↗
        </button>
        <button
          onClick={() => {
            setPanel("sources");
            setMenu(false);
          }}
        >
          ≡ <span>Sources & coverage</span> ↗
        </button>
        <a href={paperUrl()} target="_blank" rel="noreferrer">
          ↗ <span>Original paper</span>
          <small>23 PP.</small>
        </a>
        <p>
          Geng et al. · NeurIPS 2025
          <br />
          An independent learning companion
        </p>
      </div>
    </>
  );
  return (
    <DepthContext.Provider value={depth}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">{nav}</aside>
      <header className="topbar">
        <button
          className="mobile-menu"
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
          aria-controls="mobile-nav"
        >
          {menu ? "✕" : "☰"} <span>MeanFlow</span>
        </button>
        <div className="breadcrumb">
          RESEARCH, MADE TANGIBLE <span>/</span>
          <span>
            {String(current + 1).padStart(2, "0")} · {chapters[current].short}
          </span>
        </div>
        <div className="top-actions">
          <div
            className="depth-control"
            role="group"
            aria-label="Reading depth"
          >
            <button
              className={depth === "story" ? "selected" : ""}
              onClick={() => changeDepth("story")}
              aria-pressed={depth === "story"}
            >
              The story
            </button>
            <button
              className={depth === "math" ? "selected" : ""}
              onClick={() => changeDepth("math")}
              aria-pressed={depth === "math"}
            >
              + The math
            </button>
          </div>
          <button
            className="glossary-trigger"
            onClick={() => setPanel("glossary")}
          >
            Aa <span>Glossary</span>
          </button>
        </div>
        <div
          className="reading-progress"
          style={{ width: `${((current + 1) / chapters.length) * 100}%` }}
        />
      </header>
      {menu && (
        <div className="mobile-navigation" id="mobile-nav">
          {nav}
        </div>
      )}
      <main id="main">
        <div id="top" className="hero">
          <div className="hero-kicker">
            <span className="live-dot" /> AN INTERACTIVE GUIDE TO MEAN FLOWS{" "}
            <span className="edition">PAPER → PRACTICE</span>
          </div>
          <h1>
            From noise
            <br />
            to <em>one step.</em>
          </h1>
          <div className="hero-intro">
            <p>
              How do you turn randomness into an image—
              <br className="desktop-break" />
              without taking hundreds of steps along the way?
            </p>
            <p className="hero-description">
              A visual journey through the geometry, mathematics,
              <br className="desktop-break" />
              and experiments behind MeanFlow.
            </p>
          </div>
          <div className="hero-actions">
            <a className="primary-button" href="#generation">
              Explore the idea <span>↓</span>
            </a>
            <a
              className="text-link"
              href={paperUrl()}
              target="_blank"
              rel="noreferrer"
            >
              Read the paper ↗
            </a>
            <span className="hero-meta">
              12 chapters · learn at your own pace
            </span>
          </div>
          <HeroFlow />
          <div className="hero-caption">
            <span>
              A faster way to generate starts with a different thing to learn.
            </span>
            <span>SCROLL TO EXPLORE ↓</span>
          </div>
          {resume && chapters.some((c) => c.id === resume) && showResume && (
            <div className="resume">
              <span>Your place is saved.</span>
              <a href={`#${resume}`} onClick={() => setShowResume(false)}>
                Resume: {chapters.find((c) => c.id === resume)?.short} →
              </a>
              <button
                onClick={() => setShowResume(false)}
                aria-label="Dismiss resume suggestion"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        {chapters.map((chapter, i) => {
          const Content = content[i];
          return (
            <section
              className="chapter"
              id={chapter.id}
              key={chapter.id}
              aria-labelledby={`${chapter.id}-heading`}
            >
              <div className="chapter-heading">
                <div className="chapter-number">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <span className="eyebrow">{chapter.eyebrow}</span>
                  <h2 id={`${chapter.id}-heading`}>{chapter.title}</h2>
                </div>
              </div>
              <Content />
              <div className="chapter-footer">
                <Source pages={chapter.pages} />
                {i < 11 && (
                  <a href={`#${chapters[i + 1].id}`}>
                    Next: {chapters[i + 1].short} →
                  </a>
                )}
              </div>
            </section>
          );
        })}
        <footer className="site-footer">
          <a className="footer-brand" href="#top">
            MeanFlow <span>↑ Back to the beginning</span>
          </a>
          <p>
            Based on <i>Mean Flows for One-step Generative Modeling</i> by
            Zhengyang Geng, Mingyang Deng, Xingjian Bai, J. Zico Kolter, and
            Kaiming He. NeurIPS 2025.
          </p>
          <div>
            <a href={paperUrl()} target="_blank" rel="noreferrer">
              Source PDF ↗
            </a>
            <a href={authorsUrl} target="_blank" rel="noreferrer">
              Authors’ code ↗
            </a>
            <button onClick={() => setPanel("sources")}>
              Coverage manifest ↗
            </button>
          </div>
          <small>
            All explanations, teaching simulations, fonts, and images run
            locally. External links are optional reading.
          </small>
        </footer>
      </main>
      <dialog
        ref={dialog}
        className="reference-dialog"
        onCancel={() => setPanel(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPanel(null);
        }}
        aria-labelledby="reference-title"
      >
        <div className="dialog-bar">
          <h2 id="reference-title">
            {panel === "glossary"
              ? "A language for flows"
              : panel === "map"
                ? "Connect the concepts"
                : "Read with the source"}
          </h2>
          <button
            ref={closeButton}
            onClick={() => setPanel(null)}
            aria-label="Close reference panel"
          >
            ✕
          </button>
        </div>
        {panel === "glossary" && (
          <>
            <label className="search-label">
              Search a term or symbol
              <input
                autoFocus
                type="search"
                placeholder="Try “JVP”, “t”, or “average”…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="glossary-list">
              {glossary
                .filter((g) =>
                  `${g.term} ${g.symbol} ${g.definition}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((g) => (
                  <details key={g.term}>
                    <summary>
                      <strong>{g.term}</strong>
                      <span>{g.symbol}</span>
                    </summary>
                    <p>{g.definition}</p>
                    <a href={`#${g.chapter}`} onClick={() => setPanel(null)}>
                      See it in the story →
                    </a>
                  </details>
                ))}
              {!glossary.some((g) =>
                `${g.term} ${g.symbol} ${g.definition}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ) && <p>No matching term. Try “velocity” or “time”.</p>}
            </div>
          </>
        )}
        {panel === "map" && (
          <>
            <p>
              Each idea supplies the next. Follow the main sequence, or return
              to a prerequisite before opening a deeper dive.
            </p>
            <div className="concept-map">
              {[
                [
                  "generation",
                  "Samples & distributions",
                  "The objects we want to transform",
                ],
                [
                  "flow",
                  "Interpolants & velocity",
                  "How local directions transport probability",
                ],
                [
                  "euler",
                  "Curvature & integration error",
                  "Why a tangent cannot summarize a whole path",
                ],
                [
                  "average",
                  "Average velocity",
                  "The displacement of an entire interval",
                ],
                [
                  "identity",
                  "The identity & its boundary",
                  "A local equation for that average",
                ],
                [
                  "training",
                  "JVP & detached learning",
                  "Turn the equation into a trainable recipe",
                ],
                [
                  "model",
                  "Architecture & conditioning",
                  "Represent u(z,r,t) with a network",
                ],
                [
                  "guidance",
                  "Guidance & training choices",
                  "Build the desired field into the target",
                ],
                [
                  "sampling",
                  "One-step generation",
                  "Use the learned interval prediction",
                ],
                [
                  "evidence",
                  "Evidence & limitations",
                  "Check what the experiments support",
                ],
              ].map(([id, title, desc], i) => (
                <a href={`#${id}`} key={id} onClick={() => setPanel(null)}>
                  <span>{i + 1}</span>
                  <div>
                    <b>{title}</b>
                    <small>{desc}</small>
                  </div>
                  <span>↓</span>
                </a>
              ))}
            </div>
          </>
        )}
        {panel === "sources" && (
          <>
            <p>
              The supplied 23-page PDF is the authority for this explainer.
              Equation numbers and table values follow that document. Toy
              calculations and architecture schematics are labeled separately.
            </p>
            <div className="coverage-stats">
              <span>24 equations</span>
              <span>2 algorithms</span>
              <span>5 figures</span>
              <span>5 tables</span>
            </div>
            <label className="search-label">
              Search coverage
              <input
                type="search"
                placeholder="Equation 6, Appendix, Figure…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="coverage-list">
              {coverage
                .filter((c) =>
                  `${c.title} ${c.implementation}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((c) => (
                  <div key={c.id}>
                    <a
                      href={`#${c.chapter}`}
                      onClick={() => {
                        setDepth("math");
                        setPanel(null);
                      }}
                    >
                      {c.title} →
                    </a>
                    <Source pages={c.pages} />
                    <p>{c.implementation}</p>
                  </div>
                ))}
            </div>
            <p>
              All numbered equations are registered with symbols and explanatory
              text. Bibliography and checklist boilerplate are linked and their
              substantive disclosures are summarized.{" "}
              <a href={`${import.meta.env.BASE_URL}source-coverage.json`} download>
                Download the source-coverage manifest
              </a>
              .
            </p>
            <p className="small">
              Equation registry: {equations.length} entries. Last content audit:
              supplied PDF, pages 1–23.
            </p>
          </>
        )}
      </dialog>
    </DepthContext.Provider>
  );
}
