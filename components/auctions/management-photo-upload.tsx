"use client";

import { ImagePlus, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ManagementPhotoUpload({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const t = useTranslations("MyAuctions.live.management");
  const [names, setNames] = useState<string[]>([]);

  return <form action={action} className="mt-5 grid gap-3">
    <input id="management-photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required className="peer sr-only" onChange={(event) => setNames(Array.from(event.target.files ?? [], (file) => file.name))} />
    <div className="flex flex-wrap gap-3">
      <label htmlFor="management-photos" className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-soft border border-primary bg-surface px-4 py-2.5 font-semibold text-primary transition-colors hover:bg-surface-muted peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"><ImagePlus className="size-4" aria-hidden="true" />{t("choosePhotos")}</label>
      <Button type="submit" disabled={!names.length}><Upload className="size-4" aria-hidden="true" />{t("addPhotos")}</Button>
    </div>
    {names.length ? <ul className="grid gap-1 text-sm text-muted-foreground">{names.map((name, index) => <li key={`${name}-${index}`} className="truncate">{name}</li>)}</ul> : <p className="text-sm text-muted-foreground">{t("noPhotosSelected")}</p>}
  </form>;
}
