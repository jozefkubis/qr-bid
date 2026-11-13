"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxPhotos = 5;
const maxBytes = 5 * 1024 * 1024;

function PhotoPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const format = useFormatter();
  const t = useTranslations("PhotoPicker");
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
        {url ? <Image unoptimized src={url} alt={t("previewAlt", { name: file.name })} width={56} height={56} className="size-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold" title={file.name}>{file.name}</p>
        <p className="text-sm text-muted-foreground">{t("selectedReady", { size: format.number(file.size / 1024, { maximumFractionDigits: 1 }) })}</p>
      </div>
      <Button variant="secondary" className="shrink-0 px-3" aria-label={t("remove", { name: file.name })} onClick={onRemove}><Trash2 aria-hidden="true" className="size-4" /></Button>
    </li>
  );
}

export function PhotoPicker() {
  const t = useTranslations("PhotoPicker");
  const [photos, setPhotos] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function syncInput(next: File[]) {
    if (!inputRef.current) return;
    const transfer = new DataTransfer();
    next.forEach((file) => transfer.items.add(file));
    inputRef.current.files = transfer.files;
  }

  function addPhotos(files: File[]) {
    const supported = files.filter((file) => acceptedTypes.includes(file.type) && file.size <= maxBytes);
    const available = Math.max(0, maxPhotos - photos.length);
    const accepted = supported.slice(0, available);
    if (supported.length !== files.length) setMessage(t("invalidFile"));
    else if (supported.length > available) setMessage(t("tooMany"));
    else setMessage("");
    const next = [...photos, ...accepted];
    syncInput(next);
    setPhotos(next);
  }

  return (
    <div className="grid min-w-0 gap-4">
      <label htmlFor="auction-photos" className="font-heading text-lg font-semibold">{t("label")}</label>
      <div className="rounded-soft border-2 border-dashed border-border bg-background px-4 py-4 text-center sm:px-6 sm:py-5" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addPhotos(Array.from(event.dataTransfer.files)); }}>
        <ImagePlus aria-hidden="true" className="mx-auto mb-2 size-9 rounded-soft bg-surface-muted p-2 text-primary" />
        <p className="text-sm font-semibold">{t("add")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("dragOrBrowse")}</p>
        <input ref={inputRef} id="auction-photos" name="photos" type="file" multiple accept={acceptedTypes.join(",")} aria-describedby="photo-help" className="peer sr-only" onChange={(event) => addPhotos(Array.from(event.target.files ?? []))} />
        <label htmlFor="auction-photos" className="mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-soft border border-primary bg-surface px-4 text-sm font-semibold text-primary hover:bg-surface-muted peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">{t("choose")}</label>
        <p id="photo-help" className="mt-2 text-xs text-muted-foreground">{t("uploadHelp")}</p>
      </div>
      <p role="status" className="empty:hidden text-sm text-tertiary">{message}</p>
      {photos.length ? <ul className="grid min-w-0 gap-3">{photos.map((file, index) => <PhotoPreview key={`${file.name}-${file.lastModified}-${index}`} file={file} onRemove={() => { const next = photos.filter((_, position) => position !== index); syncInput(next); setPhotos(next); }} />)}</ul> : null}
    </div>
  );
}
