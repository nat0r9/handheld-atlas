"use client";

import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

interface GuideCoverUploadProps {
  inputName?: string;
  defaultUrl?: string;
}

export default function GuideCoverUpload({
  inputName = "coverImageUrl",
  defaultUrl = "",
}: GuideCoverUploadProps) {
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

      event.target.value = "";
      return;
    }

    const maximumSize = 5 * 1024 * 1024;

    if (file.size > maximumSize) {
      setErrorMessage("Image must be smaller than 5 MB.");

      event.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();

      const fileExtension =
        file.name.split(".").pop()?.toLowerCase() ??
        "jpg";

      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("guide-covers")
          .upload(filePath, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("guide-covers")
        .getPublicUrl(filePath);

      setImageUrl(data.publicUrl);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Guide cover upload failed.";

      setErrorMessage(message);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        Guide cover
      </label>

      <input
        type="hidden"
        name={inputName}
        value={imageUrl}
      />

      <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950 px-5 py-8 text-center transition hover:border-cyan-500">
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
              ? "Uploading cover..."
              : "Choose guide cover"}
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
        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
          <div className="relative aspect-[16/9]">
            <Image
              src={imageUrl}
              alt="Guide cover preview"
              fill
              sizes="768px"
              className="object-cover object-center"
            />
          </div>

          <div className="flex flex-wrap gap-3 p-4">
            <label className="cursor-pointer rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUpload}
                disabled={isUploading}
                className="sr-only"
              />

              Replace cover
            </label>

            <button
              type="button"
              onClick={() => {
                setImageUrl("");
                setErrorMessage("");
              }}
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
            >
              Remove cover
            </button>
          </div>
        </div>
      )}
    </div>
  );
}