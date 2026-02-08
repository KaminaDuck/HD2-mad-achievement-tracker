import { useMutation } from "@tanstack/react-query";
import { client } from "../lib/api.ts";

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const res = await client.api.upload.$post({
        form: { file },
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(
          "error" in body ? body.error : "Upload failed",
        );
      }
      return res.json();
    },
  });
}
