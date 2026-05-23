/**
 * Character media under `frontend/public/characters/`.
 * Add files named `{gender}-{role}.mp4` and `{gender}-{role}.png` (poster).
 * Example: male-attack.mp4, female-defend.png
 */
export function getCharacterAssets(gender, characterRole) {
  if (!gender || !characterRole) return null;
  const key = `${gender}-${characterRole}`;
  return {
    key,
    video: `/characters/${key}.mp4`,
    poster: `/characters/${key}.png`,
    image: `/characters/${key}.png`,
  };
}
