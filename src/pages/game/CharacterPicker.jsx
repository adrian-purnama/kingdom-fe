import { Mars, Shield, Sparkles, Sword, Venus } from "lucide-react";
import { useState } from "react";
import { apiPatchStudent, paths } from "../../lib/api.js";

const GENDERS = [
  { id: "male", label: "Male", Icon: Mars },
  { id: "female", label: "Female", Icon: Venus },
];

const ROLES = [
  { id: "attack", label: "Attacker", Icon: Sword },
  { id: "defend", label: "Tanker", Icon: Shield },
  { id: "buff", label: "Buffer", Icon: Sparkles },
];

/**
 * @param {object} props
 * @param {string | null} [props.initialGender]
 * @param {string | null} [props.initialRole]
 * @param {(student: object) => void} props.onSuccess
 * @param {() => void} [props.onCancel]
 * @param {boolean} [props.showCancel]
 */
export function CharacterPicker({
  initialGender = null,
  initialRole = null,
  onSuccess,
  onCancel,
  showCancel = false,
}) {
  const [gender, setGender] = useState(initialGender ?? "");
  const [characterRole, setCharacterRole] = useState(initialRole ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!gender || !characterRole) {
      setErr("Choose both gender and role");
      return;
    }
    setErr("");
    setSubmitting(true);
    try {
      const res = await apiPatchStudent(paths.studentCharacter, {
        gender,
        characterRole,
      });
      const data = res?.data;
      if (data) {
        onSuccess(data);
      }
    } catch (submitErr) {
      setErr(submitErr?.message ?? "Could not save character");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="game-card game-card-stack">
      <div>
        <p className="game-section-label">Choose your gender</p>
        <div className="game-choice-grid game-choice-grid--2">
          {GENDERS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`game-choice-card${gender === id ? " is-selected" : ""}`}
              onClick={() => setGender(id)}
            >
              <Icon className="game-choice-icon" strokeWidth={2} aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="game-section-label">Choose your role</p>
        <div className="game-choice-grid game-choice-grid--3">
          {ROLES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`game-choice-card${characterRole === id ? " is-selected" : ""}`}
              onClick={() => setCharacterRole(id)}
            >
              <Icon className="game-choice-icon" strokeWidth={2} aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {err ? (
        <p className="game-err" role="alert">
          {err}
        </p>
      ) : null}

      <button
        type="submit"
        className="game-btn-primary"
        disabled={submitting || !gender || !characterRole}
      >
        {submitting ? "Saving…" : "Continue"}
      </button>

      {showCancel && onCancel ? (
        <button type="button" className="game-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      ) : null}
    </form>
  );
}

export const GENDER_LABELS = { male: "Male", female: "Female" };
export const ROLE_LABELS = { attack: "Attacker", defend: "Tanker", buff: "Buffer" };
export const GENDER_ICONS = { male: Mars, female: Venus };
export const ROLE_ICONS = { attack: Sword, defend: Shield, buff: Sparkles };
