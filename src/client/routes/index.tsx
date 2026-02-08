import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="py-8 text-center">
      <h1 className="text-3xl font-bold text-yellow-500">
        Achievement Tracker
      </h1>
      <p className="mt-2 text-gray-400">
        No stats yet — upload your player card to get started.
      </p>
    </div>
  );
}
