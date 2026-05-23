/* eslint-disable react-refresh/only-export-components -- context + hook module */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  apiGetStudent,
  clearStudentToken,
  getStudentToken,
  paths,
  setStudentToken,
} from "../lib/api.js";

/** @typedef {{ id: string; name: string; nim: string; point: number; displayPoint: number; roleLabel: string | null; housing: string; gender: string | null; characterRole: string | null; characterComplete: boolean }} StudentSession */

function mapStudent(d) {
  if (!d || typeof d.id !== "string" || typeof d.name !== "string") {
    return null;
  }
  return {
    id: d.id,
    name: d.name,
    nim: typeof d.nim === "string" ? d.nim : "",
    point: Number(d.point) || 0,
    displayPoint: Number(d.displayPoint) ?? (Number(d.point) || 0),
    roleLabel: d.roleLabel ?? null,
    housing: d.housing ?? "",
    gender: d.gender ?? null,
    characterRole: d.characterRole ?? null,
    characterComplete: Boolean(d.characterComplete),
  };
}

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const [token, setTokenState] = useState(() => getStudentToken());
  const [student, setStudent] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(
    () => Boolean(getStudentToken()),
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!getStudentToken()) {
        setStudent(null);
        setSessionLoading(false);
        return;
      }

      setSessionLoading(true);
      try {
        const res = await apiGetStudent(paths.studentMe);
        const mapped = mapStudent(res?.data);
        if (!cancelled && mapped) {
          setStudent(mapped);
          return;
        }
        if (!cancelled && getStudentToken()) {
          clearStudentToken();
          setTokenState("");
        }
        if (!cancelled) setStudent(null);
      } catch {
        if (!cancelled && getStudentToken()) {
          clearStudentToken();
          setTokenState("");
        }
        if (!cancelled) setStudent(null);
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const applySession = useCallback((nextToken, nextStudent) => {
    setStudentToken(nextToken);
    setTokenState(nextToken);
    setStudent(mapStudent(nextStudent) ?? nextStudent);
    setSessionLoading(false);
  }, []);

  const updateStudent = useCallback((partial) => {
    setStudent((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const clearSession = useCallback(() => {
    clearStudentToken();
    setTokenState("");
    setStudent(null);
    setSessionLoading(false);
  }, []);

  const value = useMemo(
    () => ({
      student,
      isStudentAuthenticated: student != null,
      sessionLoading,
      applySession,
      updateStudent,
      clearSession,
    }),
    [student, sessionLoading, applySession, updateStudent, clearSession],
  );

  return (
    <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (ctx == null) {
    throw new Error("useStudent must be used within StudentProvider");
  }
  return ctx;
}
