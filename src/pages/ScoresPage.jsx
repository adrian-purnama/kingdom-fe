import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useHousingScoresWs } from "../hooks/useHousingScoresWs.js";
import { apiGetPublic, paths } from "../lib/api.js";

const HOUSING_THEMES = {
  scientia: {
    bar: "from-blue-400 to-blue-600",
    badge: "bg-blue-500/20 text-blue-300",
    glow: "shadow-blue-500/40",
  },
  clipa: {
    bar: "from-emerald-400 to-emerald-600",
    badge: "bg-emerald-500/20 text-emerald-300",
    glow: "shadow-emerald-500/40",
  },
  ventura: {
    bar: "from-amber-400 to-amber-600",
    badge: "bg-amber-500/20 text-amber-300",
    glow: "shadow-amber-500/40",
  },
};

const STATUS_LABELS = {
  connecting: { text: "Connecting…", dot: "bg-amber-400 animate-pulse" },
  connected: { text: "Live", dot: "bg-emerald-500" },
  reconnecting: { text: "Reconnecting…", dot: "bg-amber-400 animate-pulse" },
  disconnected: { text: "Offline", dot: "bg-red-500" },
};

function sortByPoints(rows) {
  return [...rows].sort((a, b) => {
    const diff = (b.point ?? 0) - (a.point ?? 0);
    if (diff !== 0) return diff;
    return String(a.slug).localeCompare(String(b.slug));
  });
}

export function ScoresPage() {
  const { housing: wsHousing, clientCount, status } = useHousingScoresWs();
  const [restHousing, setRestHousing] = useState([]);
  const [loadErr, setLoadErr] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGetPublic(paths.housingScores);
        if (!cancelled) {
          setRestHousing(res?.data?.housing ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadErr(e?.message ?? "Failed to load scores");
        }
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const housing = useMemo(() => {
    const source = wsHousing.length > 0 ? wsHousing : restHousing;
    return sortByPoints(source);
  }, [wsHousing, restHousing]);

  const maxPoint = useMemo(
    () => Math.max(1, ...housing.map((h) => h.point ?? 0)),
    [housing],
  );
  const leaderPoint = housing[0]?.point ?? 0;
  const statusUi = STATUS_LABELS[status] ?? STATUS_LABELS.disconnected;
  const loading = initialLoading && housing.length === 0 && !loadErr;

  return (
    <div className="min-h-dvh bg-linear-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-5 py-4">
        <ScoresPageHeader
          statusUi={statusUi}
          clientCount={clientCount}
          status={status}
        />
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        {loadErr && housing.length === 0 ? (
          <p className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {loadErr}
          </p>
        ) : null}

        {loading ? (
          <p className="text-center text-sm text-zinc-400">Loading scores…</p>
        ) : housing.length === 0 ? (
          <p className="text-center text-sm text-zinc-400">
            No housing scores yet.
          </p>
        ) : (
          <>
            <BarChartPanel housing={housing} maxPoint={maxPoint} />
            <ol className="mt-8 space-y-4">
              {housing.map((row, index) => (
                <ScoresRow
                  key={row.id ?? row.slug}
                  row={row}
                  index={index}
                  maxPoint={maxPoint}
                  leaderPoint={leaderPoint}
                />
              ))}
            </ol>
          </>
        )}
      </main>
    </div>
  );
}

function ScoresPageHeader({ statusUi, clientCount, status }) {
  return (
    <ScoresPageHeaderInner
      statusUi={statusUi}
      clientCount={clientCount}
      status={status}
    />
  );
}

function ScoresPageHeaderInner({ statusUi, clientCount, status }) {
  return (
    <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
      <div>
        <Link
          to="/"
          className="mb-1 inline-block text-xs text-zinc-500 hover:text-zinc-300"
        >
          ← Home
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Housing leaderboard</h1>
        <p className="text-sm text-zinc-400">Score update</p>
      </div>
      <div className="flex flex-col items-end gap-1 text-sm">
        <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5">
          <span
            className={`size-2.5 shrink-0 rounded-full ${statusUi.dot}`}
            aria-hidden
          />
          <span className="font-medium">{statusUi.text}</span>
          {status === "connected" ? (
            <span className="text-zinc-500">· WebSocket</span>
          ) : null}
        </div>
        {status === "connected" && clientCount > 0 ? (
          <span className="text-xs text-zinc-500">
            {clientCount} viewer{clientCount === 1 ? "" : "s"} online
          </span>
        ) : null}
      </div>
    </div>
  );
}

function BarChartPanel({ housing, maxPoint }) {
  const chartMax = Math.max(maxPoint, 10);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Live bar chart
        </h2>
        <span className="text-xs text-zinc-500">scale 0 – {chartMax} pts</span>
      </div>

      <div className="flex items-end justify-center gap-4 sm:gap-10">
        {housing.map((row) => {
          const theme = HOUSING_THEMES[row.slug] ?? {
            bar: "from-primary to-primary",
            badge: "bg-zinc-700 text-zinc-200",
          };
          const pct = ((row.point ?? 0) / chartMax) * 100;

          return (
            <div
              key={row.id ?? row.slug}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <AnimatedScore value={row.point ?? 0} />
              <div className="relative h-48 w-full max-w-24 sm:h-56 sm:max-w-28">
                <div className="absolute inset-0 rounded-t-xl border border-zinc-700/60 bg-zinc-800/50" />
                {[25, 50, 75].map((tick) => (
                  <BarChartTick key={tick} tick={tick} />
                ))}
                <AnimatedVerticalBar
                  pct={pct}
                  gradient={theme.bar}
                  slug={row.slug}
                />
              </div>
              <p className="truncate text-center text-sm font-semibold">{row.name}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide ${theme.badge}`}
              >
                {row.slug}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BarChartTick({ tick }) {
  return (
    <div
      className="absolute inset-x-0 border-t border-dashed border-zinc-700/40"
      style={{ bottom: `${tick}%` }}
    />
  );
}

function AnimatedVerticalBar({ pct, gradient, slug }) {
  const [heightPct, setHeightPct] = useState(0);
  const [flash, setFlash] = useState(false);
  const prevPctRef = useRef(0);

  useEffect(() => {
    if (pct > prevPctRef.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      prevPctRef.current = pct;
      const raf = requestAnimationFrame(() => setHeightPct(pct));
      return () => {
        clearTimeout(t);
        cancelAnimationFrame(raf);
      };
    }
    prevPctRef.current = pct;
    const raf = requestAnimationFrame(() => setHeightPct(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct, slug]);

  return (
    <div
      className={`absolute bottom-0 left-2 right-2 rounded-t-lg bg-linear-to-t transition-[height,box-shadow] duration-700 ease-out ${gradient} ${
        flash ? "shadow-lg shadow-white/25" : ""
      }`}
      style={{ height: `${heightPct}%` }}
    />
  );
}

function AnimatedHorizontalBar({ pct, gradient, slug }) {
  const [widthPct, setWidthPct] = useState(0);
  const [flash, setFlash] = useState(false);
  const prevPctRef = useRef(0);

  useEffect(() => {
    if (pct > prevPctRef.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      prevPctRef.current = pct;
      const raf = requestAnimationFrame(() => setWidthPct(pct));
      return () => {
        clearTimeout(t);
        cancelAnimationFrame(raf);
      };
    }
    prevPctRef.current = pct;
    const raf = requestAnimationFrame(() => setWidthPct(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct, slug]);

  return (
    <div
      className={`h-full rounded-md bg-linear-to-r transition-[width,box-shadow] duration-700 ease-out ${gradient} ${
        flash ? "shadow-md shadow-white/20" : ""
      }`}
      style={{ width: `${widthPct}%` }}
    />
  );
}

function AnimatedScore({ value }) {
  const [display, setDisplay] = useState(value);
  const [bump, setBump] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = to;

    if (to <= from) {
      setDisplay(to);
      return undefined;
    }

    setBump(true);
    const bumpTimer = setTimeout(() => setBump(false), 500);

    const start = performance.now();
    const duration = 600;
    let raf = 0;

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(bumpTimer);
    };
  }, [value]);

  return (
    <span
      className={`text-2xl font-bold tabular-nums transition-transform duration-300 sm:text-3xl ${
        bump ? "scale-110 text-white" : "text-zinc-100"
      }`}
    >
      {display}
    </span>
  );
}

function ScoresRow({ row, index, maxPoint, leaderPoint }) {
  const theme = HOUSING_THEMES[row.slug] ?? {
    bar: "from-primary to-primary",
    badge: "bg-zinc-800 text-zinc-200",
    glow: "shadow-primary/30",
  };
  const point = row.point ?? 0;
  const pct = (point / maxPoint) * 100;
  const gap = leaderPoint - point;
  const isLeader = index === 0 && leaderPoint > 0;

  return (
    <li
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg transition-shadow duration-500 sm:p-5 ${
        isLeader ? `shadow-xl ${theme.glow}` : ""
      }`}
    >
      <ScoresRowInner
        row={row}
        index={index}
        point={point}
        pct={pct}
        gap={gap}
        isLeader={isLeader}
        theme={theme}
      />
    </li>
  );
}

function ScoresRowInner({ row, index, point, pct, gap, isLeader, theme }) {
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-300">
            #{index + 1}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{row.name}</h2>
              {isLeader ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${theme.badge}`}
                >
                  Leading
                </span>
              ) : null}
            </div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              {row.slug}
            </p>
          </div>
        </div>
        <AnimatedScore value={point} />
      </div>

      <div className="relative h-10 overflow-hidden rounded-lg bg-zinc-800 sm:h-12">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-full">
          {[25, 50, 75].map((tick) => (
            <div
              key={tick}
              className="absolute inset-y-0 w-px bg-zinc-700/50"
              style={{ left: `${tick}%` }}
            />
          ))}
        </div>
        <AnimatedHorizontalBar pct={pct} gradient={theme.bar} slug={row.slug} />
      </div>

      {index > 0 && gap > 0 ? (
        <p className="mt-2 text-xs text-zinc-500">
          {gap} point{gap === 1 ? "" : "s"} behind leader
        </p>
      ) : null}
    </>
  );
}
