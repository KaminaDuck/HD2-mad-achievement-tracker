import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <Link to="/" className="text-lg font-bold text-yellow-500">
            808th Mad Bastards
          </Link>
          <div className="flex gap-4 text-sm">
            <Link
              to="/"
              className="text-gray-400 hover:text-gray-100 [&.active]:text-yellow-500"
            >
              Dashboard
            </Link>
            <Link
              to="/upload"
              className="text-gray-400 hover:text-gray-100 [&.active]:text-yellow-500"
            >
              Upload
            </Link>
            <Link
              to="/achievements"
              className="text-gray-400 hover:text-gray-100 [&.active]:text-yellow-500"
            >
              Achievements
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
