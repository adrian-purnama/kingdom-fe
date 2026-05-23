import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserCircle } from "lucide-react";
import { useStudent } from "../../context/StudentContext.jsx";
import {
  apiGetPublic,
  apiPostPublic,
  paths,
  setStudentToken,
} from "../../lib/api.js";
import { useDebouncedValue } from "../../lib/useDebouncedValue.js";
import { CharacterPicker } from "./CharacterPicker.jsx";
import { StudentProfile } from "./StudentProfile.jsx";

const HOUSING_LABELS = {
  scientia: "Scientia",
  clipa: "Clipa",
  ventura: "Ventura",
};

const STEP_SEARCH = "search";
const STEP_PIN = "pin";
const STEP_CHARACTER = "character";
const STEP_DASHBOARD = "dashboard";

const STEP_ORDER = [STEP_SEARCH, STEP_PIN, STEP_CHARACTER, STEP_DASHBOARD];

function GameLogo() {
  const [src, setSrc] = useState("/logo.png");

  return (
    <img
      src={src}
      alt=""
      className="game-logo"
      width={112}
      height={112}
      onError={() => {
        if (src !== "/logo.svg") setSrc("/logo.svg");
      }}
    />
  );
}

function resolveStep(student, explicitStep) {
  if (!student) return explicitStep;
  if (!student.characterComplete && explicitStep === STEP_DASHBOARD) {
    return STEP_CHARACTER;
  }
  return explicitStep;
}

export function GamePage() {
  const {
    student,
    isStudentAuthenticated,
    sessionLoading,
    applySession,
    updateStudent,
    clearSession,
  } = useStudent();

  const [step, setStep] = useState(STEP_SEARCH);
  const [searchInput, setSearchInput] = useState("");
  const debouncedQuery = useDebouncedValue(searchInput, 300);
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [shakeErr, setShakeErr] = useState(false);
  const searchGen = useRef(0);

  useEffect(() => {
    if (!sessionLoading && isStudentAuthenticated && student) {
      setStep(
        student.characterComplete ? STEP_DASHBOARD : STEP_CHARACTER,
      );
    }
  }, [sessionLoading, isStudentAuthenticated, student]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchLoading(false);
      return;
    }

    const gen = ++searchGen.current;
    setSearchLoading(true);
    setErr("");

    (async () => {
      try {
        const qs = new URLSearchParams({ q, limit: "8" });
        const res = await apiGetPublic(`${paths.studentSearch}?${qs}`);
        if (searchGen.current !== gen) return;
        setResults(res?.data?.students ?? []);
      } catch (e) {
        if (searchGen.current !== gen) return;
        setErr(e?.message ?? "Search failed");
        setResults([]);
      } finally {
        if (searchGen.current === gen) setSearchLoading(false);
      }
    })();
  }, [debouncedQuery]);

  const showErr = useCallback((message) => {
    setErr(message);
    setShakeErr(true);
    window.setTimeout(() => setShakeErr(false), 500);
  }, []);

  function selectStudent(row) {
    setSelected(row);
    setPin("");
    setErr("");
    setStep(STEP_PIN);
  }

  function backToSearch() {
    setSelected(null);
    setPin("");
    setErr("");
    setStep(STEP_SEARCH);
  }

  async function submitPin(e) {
    e.preventDefault();
    if (!selected) return;
    const pinVal = pin.replace(/\D/g, "").slice(0, 6);
    if (pinVal.length !== 6) {
      showErr("Enter all 6 digits of your PIN");
      return;
    }
    setPinSubmitting(true);
    setErr("");
    try {
      const res = await apiPostPublic(paths.studentLogin, {
        studentId: selected.id,
        pin: pinVal,
      });
      const data = res?.data ?? {};
      const token = data.token;
      const s = data.student;
      if (!token || !s) {
        showErr("Login failed");
        return;
      }
      setStudentToken(token);
      applySession(token, s);
      setStep(s.characterComplete ? STEP_DASHBOARD : STEP_CHARACTER);
    } catch (loginErr) {
      showErr(loginErr?.message ?? "Invalid PIN");
    } finally {
      setPinSubmitting(false);
    }
  }

  function handleCharacterSaved(data) {
    updateStudent({
      name: data.name ?? student?.name,
      nim: data.nim ?? student?.nim ?? "",
      gender: data.gender ?? null,
      characterRole: data.characterRole ?? null,
      characterComplete: Boolean(data.characterComplete),
      point: Number(data.point) ?? student?.point ?? 0,
      displayPoint: Number(data.displayPoint) ?? student?.displayPoint ?? 0,
      roleLabel: data.roleLabel ?? null,
      housing: data.housing ?? student?.housing ?? "",
    });
    setStep(STEP_DASHBOARD);
    setErr("");
  }

  function handleLogout() {
    clearSession();
    setSearchInput("");
    setResults([]);
    setSelected(null);
    setPin("");
    setErr("");
    setStep(STEP_SEARCH);
  }

  const activeStepIndex = STEP_ORDER.indexOf(
    resolveStep(student, step),
  );

  const subtitles = {
    [STEP_SEARCH]: "Find yourself and play",
    [STEP_PIN]: "Prove it's you",
    [STEP_CHARACTER]: "Build your character",
    [STEP_DASHBOARD]: "Your complete profile",
  };

  if (sessionLoading) {
    return (
      <div className="game-panel">
        <p className="game-loading">Loading your quest…</p>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <header className="game-header">
        <GameLogo />
        <h1 className="game-title">Student Quest</h1>
        <p className="game-subtitle">{subtitles[step] ?? subtitles[STEP_SEARCH]}</p>
      </header>

      <div className="game-steps" aria-hidden>
        {STEP_ORDER.map((s, i) => (
          <span
            key={s}
            className={`game-step-dot${i <= activeStepIndex ? " is-active" : ""}`}
          />
        ))}
      </div>

      <div className="game-body">
        {step === STEP_SEARCH ? (
          <div className="game-card">
            <label className="game-search-label">
              <Search aria-hidden />
              Enter your name
            </label>
            <input
              type="text"
              className="game-input"
              placeholder="Type your name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            {searchLoading ? (
              <p className="game-loading">Searching…</p>
            ) : null}
            {!searchLoading &&
            debouncedQuery.trim().length >= 2 &&
            results.length === 0 ? (
              <p className="game-hint">No matches. Try a different spelling.</p>
            ) : null}
            {debouncedQuery.trim().length < 2 ? (
              <p className="game-hint">Type at least 2 characters to search.</p>
            ) : null}
            <div className="game-result-list">
              {results.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className="game-result-btn"
                  onClick={() => selectStudent(row)}
                >
                  <UserCircle
                    className="inline-block size-4 shrink-0 opacity-70"
                    aria-hidden
                  />
                  {row.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === STEP_PIN && selected ? (
          <div className="game-card">
            <p className="text-center text-sm text-zinc-400">
              Playing as{" "}
              <span className="font-semibold text-primary">{selected.name}</span>
            </p>
            <p className="mt-3 text-center text-xs text-zinc-500">
              Enter the last 6 digits of your NIM
            </p>
            <form onSubmit={submitPin} className="mt-5 flex flex-col gap-4">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                className="game-input text-center text-2xl tracking-[0.5em]"
                placeholder="••••••"
                value={pin}
                autoFocus
                autoComplete="off"
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
              <button
                type="submit"
                className="game-btn-primary"
                disabled={pinSubmitting || pin.length < 6}
              >
                {pinSubmitting ? "Checking…" : "Continue"}
              </button>
            </form>
            <button type="button" className="game-btn-ghost" onClick={backToSearch}>
              ← Back to search
            </button>
          </div>
        ) : null}

        {step === STEP_CHARACTER ? (
          <CharacterPicker
            initialGender={student?.gender}
            initialRole={student?.characterRole}
            onSuccess={handleCharacterSaved}
            showCancel={Boolean(student?.characterComplete)}
            onCancel={() => setStep(STEP_DASHBOARD)}
          />
        ) : null}

        {step === STEP_DASHBOARD && student ? (
          <StudentProfile
            student={student}
            housingLabels={HOUSING_LABELS}
            onChangeCharacter={() => setStep(STEP_CHARACTER)}
            onLogout={handleLogout}
          />
        ) : null}

        {err ? (
          <p className={`game-err${shakeErr ? " is-shake" : ""}`} role="alert">
            {err}
          </p>
        ) : null}
      </div>

      <p className="game-footer-link game-hint">
        <Link to="/" className="text-primary hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
