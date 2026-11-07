"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

function PhotoPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    const timer = window.setTimeout(() => setUrl(objectUrl), 0);
    return () => {
      window.clearTimeout(timer);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return (
    <li className="flex min-w-0 items-center gap-3 rounded-soft border border-border p-3">
      <div className="size-14 shrink-0 overflow-hidden rounded-soft bg-surface-muted">
        {url ? <Image unoptimized src={url} alt={`Preview of ${file.name}`} width={56} height={56} className="size-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold" title={file.name}>{file.name}</p>
        <p className="text-sm text-muted-foreground">{new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(file.size / 1024)} KB · Selected locally</p>
      </div>
      <Button variant="secondary" className="shrink-0 px-3" aria-label={`Remove ${file.name}`} onClick={onRemove}><Trash2 aria-hidden="true" className="size-4" /></Button>
    </li>
  );
}

export function PhotoPicker() {
  const [photos, setPhotos] = useState<File[]>([]);
  const [message, setMessage] = useState("");

  function addPhotos(files: File[]) {
    const supported = files.filter((file) => acceptedTypes.includes(file.type));
    setMessage(supported.length !== files.length ? "Choose JPG, PNG or WebP images. Other file types were skipped." : "");
    setPhotos((current) => [...current, ...supported]);
  }

  return (
    <div className="grid min-w-0 gap-4">
      <label htmlFor="auction-photos" className="font-heading text-lg font-semibold">Photos / Images</label>
      <div className="rounded-soft border-2 border-dashed border-border bg-background px-4 py-4 text-center sm:px-6 sm:py-5" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addPhotos(Array.from(event.dataTransfer.files)); }}>
        <ImagePlus aria-hidden="true" className="mx-auto mb-2 size-9 rounded-soft bg-surface-muted p-2 text-primary" />
        <p className="text-sm font-semibold">Add photos</p>
        <p className="mt-1 text-xs text-muted-foreground">Drag photos here or click to browse</p>
        <input id="auction-photos" type="file" multiple accept={acceptedTypes.join(",")} aria-describedby="photo-help" className="peer sr-only" onChange={(event) => { addPhotos(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
        <label htmlFor="auction-photos" className="mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-soft border border-primary bg-surface px-4 text-sm font-semibold text-primary hover:bg-surface-muted peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">Choose photos</label>
        <p id="photo-help" className="mt-2 text-xs text-muted-foreground">JPG, PNG or WebP. Local previews only; no photos are uploaded.</p>
      </div>
      <p role="status" className="empty:hidden text-sm text-tertiary">{message}</p>
      {photos.length ? <ul className="grid min-w-0 gap-3">{photos.map((file, index) => <PhotoPreview key={`${file.name}-${file.lastModified}-${index}`} file={file} onRemove={() => setPhotos((current) => current.filter((_, position) => position !== index))} />)}</ul> : null}
    </div>
  );
}
