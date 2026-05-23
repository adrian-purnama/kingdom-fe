import { Outlet } from "react-router-dom";
import "./game.css";

export function GameLayout() {
  return (
    <div className="game-shell">
      <div className="game-shell__glow game-shell__glow--a" aria-hidden />
      <div className="game-shell__glow game-shell__glow--b" aria-hidden />
      <Outlet />
    </div>
  );
}
