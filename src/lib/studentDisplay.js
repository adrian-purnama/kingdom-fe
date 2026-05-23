/** Attacker / Tanker: base × 10. Buffer: base only. */
export function computeDisplayPoint(point, characterRole) {
  const base = Number.isFinite(Number(point)) ? Math.max(0, Number(point)) : 0;
  if (characterRole === "attack" || characterRole === "defend") {
    return base * 10;
  }
  return base;
}

export const ROLE_DISPLAY_LABELS = {
  attack: "Attacker",
  defend: "Tanker",
  buff: "Buffer",
};

export function roleDisplayLabel(characterRole) {
  return ROLE_DISPLAY_LABELS[characterRole] ?? characterRole ?? "—";
}
