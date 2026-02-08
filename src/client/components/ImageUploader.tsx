import { useState, useRef, useEffect } from "react";

const MAX_FILES = 3;

interface ImageUploaderProps {
  onUpload: (files: File[]) => void;
  isPending: boolean;
  error?: string | null;
}

export function ImageUploader({ onUpload, isPending, error }: ImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke preview URLs on cleanup
  useEffect(() => {
    return () => {
      for (const url of previews) URL.revokeObjectURL(url);
    };
  }, [previews]);

  function addFiles(newFiles: File[]) {
    const remaining = MAX_FILES - files.length;
    const toAdd = newFiles.slice(0, remaining);
    if (toAdd.length === 0) return;

    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index]!);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    addFiles(selected);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function handleSubmit() {
    if (files.length > 0) onUpload(files);
  }

  const canAddMore = files.length < MAX_FILES;

  return (
    <div className="space-y-4">
      {/* Drop zone / file selector */}
      {canAddMore && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? "border-yellow-500 bg-yellow-500/5"
              : "border-gray-700 hover:border-gray-600"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            multiple
            onChange={handleChange}
            className="hidden"
          />
          {isPending ? (
            <p className="text-gray-400">Processing images...</p>
          ) : (
            <>
              <p className="text-gray-300">
                Drop images here, or click to browse
              </p>
              <p className="mt-1 text-sm text-gray-500">
                PNG or JPEG, max 5MB each — up to {MAX_FILES} images
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Image preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {previews.map((url, i) => (
            <div key={url} className="group relative overflow-hidden rounded-lg border border-gray-800">
              <img
                src={url}
                alt={`Upload preview ${i + 1}`}
                className="aspect-video w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                disabled={isPending}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-gray-300 opacity-0 transition-opacity hover:bg-red-900 hover:text-white group-hover:opacity-100"
                aria-label={`Remove image ${i + 1}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Status + submit */}
      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {files.length} of {MAX_FILES} images added
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-md bg-yellow-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-500 disabled:opacity-50"
          >
            {isPending
              ? "Processing..."
              : `Process ${files.length} image${files.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
