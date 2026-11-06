export function LanguagePreview() {
  return (
    <div className="flex items-center gap-2" title="Language switching coming soon">
      <div role="group" aria-label="Language selection — coming soon" className="inline-flex rounded-full border border-border bg-surface-muted p-1">
        <button type="button" disabled aria-pressed="true" aria-label="English — current language" className="min-h-9 min-w-10 cursor-not-allowed rounded-full bg-surface px-2 text-xs font-bold text-primary">
          EN
        </button>
        <button type="button" disabled aria-pressed="false" aria-label="Slovak — coming soon" className="min-h-9 min-w-10 cursor-not-allowed rounded-full px-2 text-xs text-muted-foreground">
          SK
        </button>
      </div>
      <span className="text-xs text-muted-foreground">Soon</span>
    </div>
  );
}
