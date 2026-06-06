"use client";

import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

interface GameCoverUploadProps {
  inputName?: string;
  defaultUrl?: string;
}

export default function GameCoverUpload({
  inputName = "coverImageUrl",
  defaultUrl = "",
}: GameCoverUploadProps) {
  const [imageUrl, setImageUrl] = useState(defaultUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setErrorMessage("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        "Only JPG, PNG and WebP images are allowed.",
      );
      return;
    }

    const maximumSize = 5 * 1024 * 1024;

    if (file.size > maximumSize) {
      setErrorMessage("Image must be smaller than 5 MB.");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();

      const fileExtension =
        file.name.split(".").pop()?.toLowerCase() ?? "jpg";

      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("game-covers")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("game-covers")
        .getPublicUrl(filePath);

      setImageUrl(data.publicUrl);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Image upload failed.";

      setErrorMessage(message);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        Cover image
      </label>

      <input
        type="hidden"
        name={inputName}
        value={imageUrl}
      />

      <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950 px-5 py-8 text-center transition hover:border-cyan-500">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          disabled={isUploading}
          className="sr-only"
        />

        <span>
          <span className="block font-bold text-slate-200">
            {isUploading
              ? "Uploading image..."
              : "Choose cover image"}
          </span>

          <span className="mt-2 block text-sm text-slate-500">
            JPG, PNG or WebP · maximum 5 MB
          </span>
        </span>
      </label>

      {errorMessage && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {imageUrl && (
        <div className="mt-4">
          <div className="relative aspect-[3/4] max-w-56 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            <Image
              src={imageUrl}
              alt="Game cover preview"
              fill
              sizes="224px"
              className="object-cover"
            />
          </div>

          <button
            type="button"
            onClick={() => setImageUrl("")}
            className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            Remove image
          </button>
        </div>
      )}
    </div>
  );
}