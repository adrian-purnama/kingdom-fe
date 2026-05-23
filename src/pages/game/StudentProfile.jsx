import { useState } from "react";
import { getCharacterAssets } from "../../lib/characterAssets.js";
import {
  GENDER_ICONS,
  GENDER_LABELS,
  ROLE_ICONS,
} from "./CharacterPicker.jsx";
import { roleDisplayLabel } from "../../lib/studentDisplay.js";

/**
 * @param {object} props
 * @param {{ name: string; nim?: string; point: number; displayPoint?: number; roleLabel?: string | null; housing: string; gender: string | null; characterRole: string | null }} props.student
 * @param {Record<string, string>} [props.housingLabels]
 * @param {() => void} [props.onChangeCharacter]
 * @param {() => void} [props.onLogout]
 */
const DEFAULT_HOUSING_LABELS = {
  scientia: "Scientia",
  clipa: "Clipa",
  ventura: "Ventura",
};

export function StudentProfile({
  student,
  housingLabels = DEFAULT_HOUSING_LABELS,
  onChangeCharacter,
  onLogout,
}) {
  const assets = getCharacterAssets(student.gender, student.characterRole);
  const [videoOk, setVideoOk] = useState(true);
  const [posterOk, setPosterOk] = useState(true);

  const displayPoint =
    student.displayPoint ??
    (student.characterRole === "attack" || student.characterRole === "defend"
      ? student.point * 10
      : student.point);

  const roleLabel =
    student.roleLabel ?? roleDisplayLabel(student.characterRole);
  const GenderIcon = student.gender ? GENDER_ICONS[student.gender] : null;
  const RoleIcon = student.characterRole
    ? ROLE_ICONS[student.characterRole]
    : null;

  const showMultiplier =
    student.characterRole === "attack" || student.characterRole === "defend";

  return (
    <div className="game-card game-profile">
      <h2 className="game-profile__title">Your profile</h2>

      {assets ? (
        <div className="game-profile__media">
          {videoOk ? (
            <video
              key={assets.video}
              className="game-profile__video"
              src={assets.video}
              poster={posterOk ? assets.poster : undefined}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setVideoOk(false)}
            />
          ) : null}
          {!videoOk && posterOk ? (
            <img
              src={assets.poster}
              alt=""
              className="game-profile__image"
              onError={() => setPosterOk(false)}
            />
          ) : null}
          {!videoOk && !posterOk ? (
            <div className="game-profile__placeholder" aria-hidden>
              {RoleIcon ? <RoleIcon className="game-profile__placeholder-icon" /> : null}
              <span className="text-xs text-zinc-500">
                Add {assets.key}.mp4 and {assets.key}.png to public/characters/
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <dl className="game-profile__stats">
        <div className="game-profile__row">
          <dt>Name</dt>
          <dd>{student.name}</dd>
        </div>
        <div className="game-profile__row">
          <dt>NIM</dt>
          <dd className="font-mono text-sm">{student.nim ?? "—"}</dd>
        </div>
        <div className="game-profile__row">
          <dt>Base points</dt>
          <dd className="tabular-nums">{student.point}</dd>
        </div>
        <div className="game-profile__row">
          <dt>Role</dt>
          <dd className="flex items-center justify-end gap-1.5">
            {RoleIcon ? <RoleIcon className="size-4 text-primary" aria-hidden /> : null}
            {roleLabel}
          </dd>
        </div>
        {student.gender ? (
          <div className="game-profile__row">
            <dt>Gender</dt>
            <dd className="flex items-center justify-end gap-1.5">
              {GenderIcon ? (
                <GenderIcon className="size-4 text-primary" aria-hidden />
              ) : null}
              {GENDER_LABELS[student.gender] ?? student.gender}
            </dd>
          </div>
        ) : null}
        <div className="game-profile__row">
          <dt>Housing</dt>
          <dd>{housingLabels[student.housing] ?? student.housing}</dd>
        </div>
        <div className="game-profile__row game-profile__row--highlight">
          <dt>{showMultiplier ? "Battle points (×10)" : "Points"}</dt>
          <dd className="game-profile__score tabular-nums">{displayPoint}</dd>
        </div>
      </dl>

      {showMultiplier ? (
        <p className="game-profile__note">
          {roleLabel} role multiplies your base points by 10.
        </p>
      ) : (
        <p className="game-profile__note">Buffer role uses your base points as-is.</p>
      )}

      <div className="game-profile__actions">
        {onChangeCharacter ? (
          <button type="button" className="game-btn-ghost !mt-0" onClick={onChangeCharacter}>
            Change character
          </button>
        ) : null}
        {onLogout ? (
          <button type="button" className="game-btn-primary" onClick={onLogout}>
            Log out
          </button>
        ) : null}
      </div>
    </div>
  );
}
