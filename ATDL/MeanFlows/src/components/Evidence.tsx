import { useEffect, useMemo, useRef, useState } from "react";
import { scaleLinear } from "d3-scale";
import {
  compute,
  configRows,
  experiments,
  models,
  scaling,
  type PlotPoint,
} from "../data/experiments";
import { paperUrl } from "../data/paper";
import { Choice, Source } from "./common";
const palette: Record<string, string> = {
  "B/2": "#9db4f0",
  "M/2": "#efb27d",
  "L/2": "#7fccb3",
  "XL/2": "#d7b1e5",
  MeanFlow: "#cbe7ae",
  Baseline: "#c1b0e6",
};
export function EvidencePlots() {
  const [figure, setFigure] = useState("Figure 4 · Scaling"),
    [filter, setFilter] = useState("All"),
    [selected, setSelected] = useState<PlotPoint | null>(null);
  const isScale = figure.startsWith("Figure 4");
  const points = (isScale ? scaling : compute).filter(
    (p) => filter === "All" || p.group === filter,
  );
  const x = scaleLinear()
      .domain(isScale ? [25, 255] : [34.8, 40.2])
      .range([65, 730]),
    y = scaleLinear()
      .domain(isScale ? [2, 10.5] : [0, 38])
      .range([315, 30]);
  const groups = isScale
    ? ["B/2", "M/2", "L/2", "XL/2"]
    : ["MeanFlow", "Baseline"];
  return (
    <div className="lab evidence-chart">
      <div className="lab-heading">
        <span>RECONSTRUCT THE EVIDENCE</span>
        <span className="tag">Paper measurements</span>
      </div>
      <Choice
        label="Evidence figure"
        options={["Figure 4 · Scaling", "Figure 1 · Compute"]}
        value={figure}
        onChange={(v) => {
          setFigure(v);
          setFilter("All");
          setSelected(null);
        }}
      />
      <Choice
        label="Plot filter"
        options={["All", ...groups]}
        value={filter}
        onChange={(v) => {
          setFilter(v);
          setSelected(null);
        }}
      />
      <svg
        viewBox="0 0 800 390"
        role="group"
        aria-label={
          isScale
            ? "MeanFlow FID by training epochs and model size"
            : "One-step FID versus training compute; compute coordinates are digitized approximations"
        }
      >
        {y.ticks(5).map((v) => (
          <g key={v}>
            <line
              x1="65"
              x2="730"
              y1={y(v)}
              y2={y(v)}
              stroke="#4e6059"
              strokeDasharray="3 5"
            />
            <text
              x="50"
              y={y(v) + 4}
              textAnchor="end"
              fill="#c6d0cb"
              fontSize="12"
            >
              {v}
            </text>
          </g>
        ))}
        {(isScale
          ? [40, 80, 120, 160, 200, 240]
          : [35, 36, 37, 38, 39, 40]
        ).map((v) => (
          <text
            key={v}
            x={x(v)}
            y="340"
            textAnchor="middle"
            fill="#c6d0cb"
            fontSize="12"
          >
            {isScale ? v : `2^${v}`}
          </text>
        ))}
        <text x="390" y="374" textAnchor="middle" fill="#c6d0cb" fontSize="13">
          {isScale
            ? "Training epochs"
            : "Training compute · GFLOPs (log₂ scale)"}
        </text>
        <text
          transform="translate(18 210) rotate(-90)"
          fill="#c6d0cb"
          fontSize="13"
        >
          {isScale ? "1-NFE FID ↓" : "1-step FID ↓"}
        </text>
        {isScale &&
          groups.map((g) => (
            <path
              key={g}
              d={points
                .filter((p) => p.group === g)
                .map((p, i) => `${i ? "L" : "M"}${x(p.x)},${y(p.y)}`)
                .join(" ")}
              fill="none"
              stroke={palette[g]}
              strokeWidth="2"
            />
          ))}
        {points.map((p) => (
          <g key={p.label}>
            <circle
              className="chart-point"
              cx={x(p.x)}
              cy={y(p.y)}
              r={isScale ? 6 : 5 + Math.sqrt(p.params || 100) / 3}
              fill={palette[p.group]}
              opacity=".9"
              stroke={selected?.label === p.label ? "#fff" : "transparent"}
              strokeWidth="3"
              tabIndex={0}
              role="button"
              aria-label={`${p.label}: FID ${p.y.toFixed(2)}${p.approximate ? ", approximate chart coordinates" : ""}`}
              onClick={() => setSelected(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(p);
                }
              }}
            />
            {(isScale ? p.x === 240 : true) && (
              <text
                x={x(p.x) + (isScale ? 12 : 0)}
                y={y(p.y) + (isScale ? 4 : p.y > 30 ? 27 : -17)}
                textAnchor={isScale ? "start" : "middle"}
                fill={palette[p.group]}
                fontSize="11"
              >
                {isScale
                  ? p.y.toFixed(2)
                  : p.label.replace("MeanFlow", "MF").replace("-XL/2", "-XL")}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="plot-selection" role="status">
        {selected ? (
          <>
            <b>{selected.label}</b> · FID {selected.y.toFixed(2)} ·{" "}
            {isScale ? `${selected.x} epochs` : `≈ 2^${selected.x} GFLOPs`}{" "}
            {selected.approximate
              ? "· digitized approximation"
              : "· exact Table 2 endpoint"}
          </>
        ) : (
          "Select a point to inspect its measurement."
        )}
      </div>
      <p className="lab-note">
        {isScale
          ? "At 240 epochs, values are exact from Table 2. Earlier visible points were digitized from Figure 4 (approximately ±0.1 FID). B/2 and M/2 at 40 epochs are clipped and omitted. Connecting lines only guide the eye."
          : "FID and parameter counts are exact from Table 2; compute positions are approximate digitizations of Figure 1 (about ±0.05 in log₂ compute). Circle sizes encode parameter count. IMM uses 2 NFE for its one step."}
      </p>
      <details className="chart-data">
        <summary>Accessible chart data</summary>
        <table>
          <thead>
            <tr>
              <th>Model / point</th>
              <th>{isScale ? "Epochs" : "log₂ GFLOPs ≈"}</th>
              <th>FID</th>
              <th>Source precision</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.label}>
                <td>{p.label}</td>
                <td>{p.x}</td>
                <td>{p.y.toFixed(2)}</td>
                <td>
                  {p.approximate
                    ? isScale
                      ? "FID approximate"
                      : "Compute approximate"
                    : "Exact"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
export function EvidenceTables() {
  const [table, setTable] = useState("2"),
    [query, setQuery] = useState(""),
    [sort, setSort] = useState<"source" | "asc" | "desc">("source");
  const filtered = useMemo(() => {
    let data = experiments.filter(
      (e) =>
        (table === "All" || e.table === table) &&
        `${e.setting} ${e.group} ${e.metadata} ${e.params} ${e.nfe}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
    if (sort !== "source")
      data = [...data].sort(
        (a, b) => (sort === "asc" ? 1 : -1) * (a.fid - b.fid),
      );
    return data;
  }, [table, query, sort]);
  const configs = configRows.filter((r) =>
    `${r.setting} ${r.values.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="evidence-tables">
      <div className="table-toolbar">
        <label>
          Paper table
          <select
            aria-label="Paper table"
            value={table}
            onChange={(e) => setTable(e.target.value)}
          >
            <option value="All">All measurements</option>
            <option value="1">1 · Every ablation</option>
            <option value="2">2 · ImageNet comparison</option>
            <option value="3">3 · CIFAR-10</option>
            <option value="4">4 · Training configurations</option>
            <option value="5">5 · Improved guidance</option>
          </select>
        </label>
        <label>
          Search
          <input
            type="search"
            placeholder="Model, setting, or metadata…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search experiment tables"
          />
        </label>
        {table !== "4" && (
          <label>
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              aria-label="Sort experimental results"
            >
              <option value="source">Paper order</option>
              <option value="asc">FID: low to high</option>
              <option value="desc">FID: high to low</option>
            </select>
          </label>
        )}
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Paper experimental data, scroll horizontally"
      >
        {table === "4" ? (
          <table>
            <caption>
              Table 4 · ImageNet 256×256 · exact configuration transcription
            </caption>
            <thead>
              <tr>
                <th>Configuration</th>
                {models.map((m) => (
                  <th key={m.name}>{m.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {configs.map((row) => (
                <tr key={row.setting}>
                  <th>{row.setting}</th>
                  {row.values.map((v, i) => (
                    <td key={i}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table>
            <caption>
              {filtered.length} measurements · single-run FID-50K · lower is
              better
            </caption>
            <thead>
              <tr>
                <th>Setting / model</th>
                <th>FID ↓</th>
                <th>NFE</th>
                <th>Params</th>
                <th>Experiment and metadata</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr
                  key={`${e.table}-${e.group}-${e.setting}-${i}`}
                  className={
                    e.setting.startsWith("MeanFlow") ? "highlight-row" : ""
                  }
                >
                  <th>{e.setting}</th>
                  <td className="fid-value">{e.fid.toFixed(2)}</td>
                  <td>{e.nfe}</td>
                  <td>{e.params}</td>
                  <td>
                    <a href={paperUrl(e.page)} target="_blank" rel="noreferrer">
                      Table {e.table} · {e.group} ↗
                    </a>
                    <small>{e.metadata}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {((table === "4" && configs.length === 0) ||
        (table !== "4" && filtered.length === 0)) && (
        <p role="status">
          No rows match “{query}”. Clear the search to see all results.
        </p>
      )}
      <p className="table-footnote">
        “×2” means two evaluations per sampling step for guidance. Table 4 lists
        configuration data, not FID; select it separately. Table 1 defaults: 25%
        r≠t, tangent (v,0,1), conditioning (t,t−r), lognorm(−0.4,1.0), p=1.0, no
        CFG except the guidance ablation.
      </p>
    </div>
  );
}
const captions = [
  "Yellow flowers against a dark green background",
  "A scarlet macaw in profile",
  "A bright pink thistle flower",
  "Snow-covered mountains above clouds",
  "A close-up chameleon",
  "A small cream-colored dog",
  "A squirrel holding food",
  "A green alpine valley",
  "Shelf mushrooms growing on a tree",
  "A white daisy",
  "An iguana in grass",
  "A shaggy light-colored terrier",
  "A close-up chicken",
  "A snail on a green leaf",
  "A rectangular pizza topped with greens",
  "Coral-like orange fungi",
  "A smoking volcano",
  "A sea urchin underwater",
  "A trilobite fossil in stone",
  "Tents below a rocky mountain",
  "A stone wall beside green grass",
  "A rabbit in low vegetation",
  "Coastal cliffs beside blue water",
  "A seated monkey",
];
export function SampleGallery() {
  const [selected, setSelected] = useState<number | null>(null),
    [zoom, setZoom] = useState(1),
    dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (selected !== null) {
      setZoom(1);
      if (!dialog.current?.open) dialog.current?.showModal();
    } else dialog.current?.close();
  }, [selected]);
  const src = (i: number) =>
    `${import.meta.env.BASE_URL}samples/figure5-${String(i).padStart(3, "0")}.png`;
  return (
    <div className="gallery">
      <div className="gallery-header">
        <div>
          <span className="eyebrow">FIGURE 5 / FROM THE PAPER</span>
          <h3>One evaluation. These images.</h3>
        </div>
        <Source pages={[23]} />
      </div>
      <p>
        Curated class-conditional ImageNet 256×256 outputs from MeanFlow-XL/2, 1
        NFE, 3.43 FID. Original image pixels extracted losslessly from the
        supplied PDF. The selection is not a random evaluation batch.
      </p>
      <div className="sample-grid">
        {captions.map((caption, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            aria-label={`Enlarge original paper sample ${i + 1}`}
          >
            <img
              src={src(i)}
              width="256"
              height="256"
              loading="lazy"
              alt={`${caption}. Curated MeanFlow output ${i + 1} from Figure 5.`}
            />
            <span>{String(i + 1).padStart(2, "0")} ↗</span>
          </button>
        ))}
      </div>
      <p className="attribution">
        Images: Zhengyang Geng, Mingyang Deng, Xingjian Bai, J. Zico Kolter &
        Kaiming He, <i>Mean Flows for One-step Generative Modeling</i>, Figure
        5. All 24 embedded images are shown without edits.
      </p>
      <dialog
        ref={dialog}
        className="gallery-dialog"
        onCancel={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelected(null);
        }}
        aria-label="Original paper sample viewer"
      >
        <div className="dialog-bar">
          <span>Figure 5 · sample {(selected ?? 0) + 1} of 24</span>
          <button
            onClick={() => setSelected(null)}
            aria-label="Close sample viewer"
          >
            ✕
          </button>
        </div>
        {selected !== null && (
          <div className="zoom-area">
            <img
              src={src(selected)}
              style={{ width: 256 * zoom }}
              alt={`${captions[selected]}. Unaltered paper sample ${selected + 1}, enlarged ${zoom} times.`}
            />
          </div>
        )}
        <div className="dialog-bar">
          <button onClick={() => setSelected((i) => (i! + 23) % 24)}>
            ← Previous image
          </button>
          <button
            onClick={() => setZoom((z) => (z === 1 ? 2 : z === 2 ? 3 : 1))}
          >
            Zoom {zoom}×
          </button>
          <button onClick={() => setSelected((i) => (i! + 1) % 24)}>
            Next image →
          </button>
        </div>
      </dialog>
    </div>
  );
}
