import { useState } from "react";

// Small parts shared by the manager analytics pages
// (Attendance analysis now, and the other analytics pages later).

export const formatNumber = (value) =>
  value === null || value === undefined
    ? "N/A"
    : new Intl.NumberFormat("en-IN").format(value);

export const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const PALETTES = {
  indigo: ["#c9cff4", "#a3aeea", "#7d8be0", "#5269d6"],
  teal: ["#bfe7df", "#8fd3c6", "#52b9a8", "#14a58f"],
};

export function StatCard({ icon: Icon, tone = "indigo", value, label, description }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    red: "bg-red-50 text-red-500",
    orange: "bg-orange-50 text-orange-500",
    purple: "bg-purple-50 text-purple-500",
    teal: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          tones[tone] || tones.indigo
        }`}
      >
        <Icon size={21} />
      </div>

      <p className="mt-5 break-words text-[28px] font-semibold leading-none tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-3 text-sm font-semibold text-slate-800">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}

// Simple bar chart (no chart library needed).
// data: [{ label, value, note?, empty? }]
export function BarChart({
  title,
  subtitle,
  data,
  palette = "indigo",
  emptyText = "No data available for this chart.",
}) {
  const colors = PALETTES[palette] || PALETTES.indigo;
  const hasData = data.some((item) => item.value > 0);
  const max = Math.max(...data.map((item) => item.value), 0);

  // Round the top of the chart up to a clean number.
  const niceMax = (() => {
    if (max <= 0) return 4;
    const rough = max / 4;
    const power = 10 ** Math.floor(Math.log10(rough));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough);
    return step * 4;
  })();

  const ticks = [0, 1, 2, 3, 4].map((i) => (niceMax / 4) * i);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>

      {!hasData ? (
        <div className="flex h-52 items-center justify-center text-sm text-slate-400">
          {emptyText}
        </div>
      ) : (
        <>
          <div className="mt-6 flex">
            <div className="relative h-52 w-10 shrink-0">
              {ticks.map((tick) => (
                <span
                  key={tick}
                  className="absolute right-2 translate-y-1/2 text-xs text-slate-400"
                  style={{ bottom: `${(tick / niceMax) * 100}%` }}
                >
                  {Number.isInteger(tick) ? tick : tick.toFixed(1)}
                </span>
              ))}
            </div>

            <div className="relative h-52 flex-1">
              {ticks.map((tick) => (
                <div
                  key={tick}
                  className="absolute left-0 right-0 border-t border-dashed border-slate-200"
                  style={{ bottom: `${(tick / niceMax) * 100}%` }}
                />
              ))}

              <div className="absolute inset-0 flex items-end justify-around px-3">
                {data.map((item, index) => (
                  <div
                    key={item.label}
                    title={item.note || ""}
                    className="flex h-full w-1/5 flex-col items-center justify-end"
                  >
                    <span className="mb-1 text-[11px] font-medium text-slate-500">
                      {item.empty ? "–" : item.value}
                    </span>
                    {!item.empty && (
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${(item.value / niceMax) * 100}%`,
                          background: colors[index % colors.length],
                          minHeight: item.value > 0 ? 4 : 0,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="ml-10 flex justify-around px-3 pt-2 text-xs text-slate-400">
            {data.map((item) => (
              <span key={item.label} className="w-1/5 text-center">
                {item.label}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// One block of text inside the AI insight card.
export function InsightBlock({ label, item, note }) {
  const [expanded, setExpanded] = useState(false);
  const text = item?.text || "";
  const isLong = text.length > 380;

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 whitespace-pre-line text-sm leading-6 text-slate-600 ${
          isLong && !expanded ? "line-clamp-4" : ""
        }`}
      >
        {text}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      {note && <p className="mt-2 text-xs italic text-slate-400">{note}</p>}
    </div>
  );
}

// Smooth line + soft area chart for values from 0 to 100 (no chart library).
// data: [{ label, value }]  (needs at least 2 points)
export function LineChart({ title, subtitle, data, color = "#14a58f" }) {
  const W = 600;
  const H = 240;
  const left = 40;
  const right = 16;
  const top = 12;
  const bottom = 30;
  const plotW = W - left - right;
  const plotH = H - top - bottom;
  const ticks = [0, 25, 50, 75, 100];

  const yOf = (value) =>
    top + plotH - (Math.min(Math.max(value, 0), 100) / 100) * plotH;
  const xOf = (index) =>
    data.length === 1 ? left + plotW / 2 : left + (index / (data.length - 1)) * plotW;

  const points = data.map((item, index) => ({ x: xOf(index), y: yOf(item.value) }));

  // Smooth curve through the points.
  let line = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    line += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }

  const baseY = top + plotH;
  const area = `${line} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;

  // Show at most about 8 labels.
  const labelStep = Math.ceil(data.length / 8);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label={title}>
        <defs>
          <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.16" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={left}
              x2={W - right}
              y1={yOf(tick)}
              y2={yOf(tick)}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <text x={left - 8} y={yOf(tick) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
              {tick}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#lineAreaGradient)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

        {points.map((point, index) => (
          <circle key={data[index].label} cx={point.x} cy={point.y} r="3.5" fill="#fff" stroke={color} strokeWidth="2">
            <title>{`${data[index].label}: ${data[index].value}%`}</title>
          </circle>
        ))}

        {data.map((item, index) =>
          index % labelStep === 0 ? (
            <text key={item.label} x={points[index].x} y={H - 8} textAnchor="middle" fontSize="11" fill="#94a3b8">
              {item.label}
            </text>
          ) : null,
        )}
      </svg>
    </section>
  );
}

// Smooth curve through a list of { x, y } points.
const smoothPath = (points) => {
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }

  return path;
};

// Line chart with one or more lines (values from 0 to 100).
// labels: ["Apr", "May", ...]
// series: [{ name, color, values: [number | null, ...] }]  (same length as labels)
export function MultiLineChart({ title, subtitle, labels, series }) {
  const W = 600;
  const H = 240;
  const left = 40;
  const right = 16;
  const top = 12;
  const bottom = 30;
  const plotW = W - left - right;
  const plotH = H - top - bottom;
  const ticks = [0, 25, 50, 75, 100];
  const baseY = top + plotH;

  const yOf = (value) => top + plotH - (Math.min(Math.max(value, 0), 100) / 100) * plotH;
  const xOf = (index) =>
    labels.length === 1 ? left + plotW / 2 : left + (index / (labels.length - 1)) * plotW;

  const lines = series.map((item, seriesIndex) => {
    const points = item.values
      .map((value, index) =>
        value === null || value === undefined
          ? null
          : { x: xOf(index), y: yOf(value), value, index },
      )
      .filter(Boolean);

    return { ...item, seriesIndex, points };
  });

  // Show at most about 8 labels.
  const labelStep = Math.ceil(labels.length / 8);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          {series.map((item) => (
            <span key={item.name} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
              {item.name}
            </span>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label={title}>
        <defs>
          {lines.map((line) => (
            <linearGradient
              key={line.name}
              id={`multiArea-${line.seriesIndex}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={line.color} stopOpacity="0.12" />
              <stop offset="100%" stopColor={line.color} stopOpacity="0.01" />
            </linearGradient>
          ))}
        </defs>

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={left}
              x2={W - right}
              y1={yOf(tick)}
              y2={yOf(tick)}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <text x={left - 8} y={yOf(tick) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
              {tick}
            </text>
          </g>
        ))}

        {lines.map((line) =>
          line.points.length >= 2 ? (
            <g key={line.name}>
              <path
                d={`${smoothPath(line.points)} L ${line.points[line.points.length - 1].x} ${baseY} L ${line.points[0].x} ${baseY} Z`}
                fill={`url(#multiArea-${line.seriesIndex})`}
              />
              <path
                d={smoothPath(line.points)}
                fill="none"
                stroke={line.color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          ) : null,
        )}

        {lines.map((line) =>
          line.points.map((point) => (
            <circle
              key={`${line.name}-${labels[point.index]}`}
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill="#fff"
              stroke={line.color}
              strokeWidth="2"
            >
              <title>{`${labels[point.index]} · ${line.name}: ${point.value}`}</title>
            </circle>
          )),
        )}

        {labels.map((label, index) =>
          index % labelStep === 0 ? (
            <text key={label} x={xOf(index)} y={H - 8} textAnchor="middle" fontSize="11" fill="#94a3b8">
              {label}
            </text>
          ) : null,
        )}
      </svg>
    </section>
  );
}