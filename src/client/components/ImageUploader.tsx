import { useState, useRef, useCallback } from "react";

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  isPending: boolean;
  error?: string | null;
}

export function ImageUploader({ onUpload, isPending, error }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setPreview(URL.createObjectURL(file));
      onUpload(file);
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="space-y-4">
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
          onChange={handleChange}
          className="hidden"
        />
        {isPending ? (
          <p className="text-gray-400">Processing image...</p>
        ) : (
          <>
            <p className="text-gray-300">
              Drop your player card here, or click to browse
            </p>
            <p className="mt-1 text-sm text-gray-500">PNG or JPEG, max 5MB</p>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {preview && (
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <img
            src={preview}
            alt="Player card preview"
            className="w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
