import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
});

function UploadPage() {
  return (
    <div className="py-8 text-center">
      <h1 className="text-2xl font-bold">Upload Player Card</h1>
      <p className="mt-2 text-gray-400">Coming soon.</p>
    </div>
  );
}
