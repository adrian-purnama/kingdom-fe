import { useState } from "react";
import { apiPost, paths } from "../lib/api.js";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100";

const HOUSING_OPTIONS = [
  { value: "scientia", label: "Scientia" },
  { value: "clipa", label: "Clipa" },
  { value: "ventura", label: "Ventura" },
];

const GENDER_OPTIONS = [
  { value: "", label: "— Not set —" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const ROLE_OPTIONS = [
  { value: "", label: "— Not set —" },
  { value: "attack", label: "Attack" },
  { value: "defend", label: "Defend" },
  { value: "buff", label: "Buff" },
];

/**
 * @param {object} props
 * @param {() => void} props.onSuccess
 * @param {() => void} props.onCancel
 */
export function CreateStudentForm({ onSuccess, onCancel }) {
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [point, setPoint] = useState("0");
  const [housing, setHousing] = useState("scientia");
  const [gender, setGender] = useState("");
  const [characterRole, setCharacterRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const n = name.trim();
    const nimVal = nim.trim();
    const pointNum = Number(point);
    if (!n) {
      setFormErr("Name is required");
      return;
    }
    if (!nimVal) {
      setFormErr("NIM is required");
      return;
    }
    if (!Number.isFinite(pointNum) || pointNum < 0) {
      setFormErr("Point must be a number >= 0");
      return;
    }
    setFormErr("");
    setSubmitting(true);
    try {
      const body = {
        name: n,
        nim: nimVal,
        point: pointNum,
        housing,
      };
      if (gender) body.gender = gender;
      if (characterRole) body.characterRole = characterRole;
      await apiPost(paths.adminStudents, body);
      onSuccess();
    } catch (err) {
      setFormErr(err?.message ?? "Could not create student");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {formErr ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {formErr}
        </p>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          autoComplete="off"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          NIM
        </label>
        <input
          type="text"
          value={nim}
          onChange={(e) => setNim(e.target.value)}
          className={inputClass}
          autoComplete="off"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Point
        </label>
        <input
          type="number"
          min={0}
          value={point}
          onChange={(e) => setPoint(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Housing
        </label>
        <select
          value={housing}
          onChange={(e) => setHousing(e.target.value)}
          className={inputClass}
        >
          {HOUSING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Gender (optional)
        </label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className={inputClass}
        >
          {GENDER_OPTIONS.map((o) => (
            <option key={o.value || "none"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Role (optional)
        </label>
        <select
          value={characterRole}
          onChange={(e) => setCharacterRole(e.target.value)}
          className={inputClass}
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value || "none"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Create student"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
