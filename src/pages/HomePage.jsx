import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";

export function HomePage() {
  const { isAuthenticated, email, isSuperAdmin } = useUser();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        Home
      </h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        {isAuthenticated
          ? `Signed in${email ? ` as ${email}` : ""}${isSuperAdmin ? " (super admin)" : ""}. Session validated with the server.`
          : "You are not logged in."}
      </p>
      <nav className="flex flex-wrap gap-4">
        <Link
          to="/game"
          className="font-medium text-primary transition-colors hover:text-primary-2"
        >
          Play
        </Link>
        <Link
          to="/login"
          className="font-medium text-primary transition-colors hover:text-primary-2"
        >
          Log in
        </Link>
        <Link
          to="/register"
          className="font-medium text-primary transition-colors hover:text-primary-2"
        >
          Register
        </Link>
      </nav>
    </div>
  );
}
