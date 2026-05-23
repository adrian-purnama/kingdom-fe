import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useUser } from "../../context/UserContext.jsx";
import { apiGet, apiPatch, paths } from "../../lib/api.js";

const HOUSING_COLORS = {
  scientia: "border-blue-400 bg-blue-50 dark:bg-blue-950/40",
  clipa: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
  ventura: "border-amber-400 bg-amber-50 dark:bg-amber-950/40",
};

const QUICK_AMOUNTS = [1, 5, 10];

export function AdminHousingPage() {
  const { isAuthenticated, isAdmin, sessionLoading } = useUser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState("");
  const [customAmounts, setCustomAmounts] = useState({});

  const loadHousing = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await apiGet(paths.adminHousing);
      setRows(res?.data?.housing ?? []);
    } catch (e) {
      setErr(e?.message ?? "Failed to load housing");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHousing();
  }, [loadHousing]);

  async function addPoints(row, amount) {
    if (busyId) return;
    setErr("");
    setBusyId(row.id);
    try {
      await apiPatch(`${paths.adminHousing}/${row.id}/points`, { amount });
      await loadHousing();
    } catch (e) {
      setErr(e?.message ?? "Failed to update points");
    } finally {
      setBusyId("");
    }
  }

  async function handleCustomSubmit(e, row) {
    e.preventDefault();
    const raw = customAmounts[row.id] ?? "";
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount === 0) {
      setErr("Enter a non-zero number (use negative to subtract)");
      return;
    }
    const next = (row.point ?? 0) + amount;
    if (next < 0) {
      setErr(`Cannot go below 0 (current: ${row.point ?? 0})`);
      return;
    }
    await addPoints(row, amount);
    setCustomAmounts((prev) => ({ ...prev, [row.id]: "" }));
  }

  if (sessionLoading) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading session…</p>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <AdminHousingHeader />
        <Link
          to="/scores"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary underline-offset-2 hover:underline"
        >
          Open public scoreboard
        </Link>
      </div>

      {err ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {err}
        </p>
      ) : null}

      {loading && rows.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading housing…</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <HousingCard
              key={row.id}
              row={row}
              isBusy={busyId === row.id}
              addPoints={addPoints}
              customAmounts={customAmounts}
              setCustomAmounts={setCustomAmounts}
              handleCustomSubmit={handleCustomSubmit}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminHousingHeader() {
  return (
    <div>
      <Link
        to="/admin"
        className="mb-2 inline-block text-sm text-zinc-500 hover:text-primary dark:text-zinc-400"
      >
        ← Admin dashboard
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        Housing scoreboard
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Add or remove team points for each housing. Changes appear live on the public
        scoreboard.
      </p>
    </div>
  );
}

function HousingCard({
  row,
  isBusy,
  addPoints,
  customAmounts,
  setCustomAmounts,
  handleCustomSubmit,
}) {
  const colorClass =
    HOUSING_COLORS[row.slug] ??
    "border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/50";

  return (
    <li className={`rounded-xl border-2 p-5 shadow-sm ${colorClass}`}>
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {row.name}
        </h2>
        <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {row.point}
        </span>
      </div>
      <p className="mb-4 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {row.slug}
      </p>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Add points
      </p>
      <HousingQuickAdd row={row} isBusy={isBusy} addPoints={addPoints} />
      <p className="mb-2 mt-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Remove points
      </p>
      <HousingQuickRemove row={row} isBusy={isBusy} addPoints={addPoints} />
      <form className="mt-3 flex gap-2" onSubmit={(e) => handleCustomSubmit(e, row)}>
        <input
          type="number"
          step="1"
          placeholder="e.g. 5 or -3"
          value={customAmounts[row.id] ?? ""}
          disabled={isBusy}
          onChange={(e) =>
            setCustomAmounts((prev) => ({
              ...prev,
              [row.id]: e.target.value,
            }))
          }
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={isBusy}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Apply
        </button>
      </form>
    </li>
  );
}

function HousingQuickAdd({ row, isBusy, addPoints }) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_AMOUNTS.map((amount) => (
        <button
          key={`add-${amount}`}
          type="button"
          disabled={isBusy}
          onClick={() => addPoints(row, amount)}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          +{amount}
        </button>
      ))}
    </div>
  );
}

function HousingQuickRemove({ row, isBusy, addPoints }) {
  const point = row.point ?? 0;
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_AMOUNTS.map((amount) => (
        <button
          key={`remove-${amount}`}
          type="button"
          disabled={isBusy || point < amount}
          onClick={() => addPoints(row, -amount)}
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
        >
          −{amount}
        </button>
      ))}
    </div>
  );
}
