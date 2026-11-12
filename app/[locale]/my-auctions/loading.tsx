export default function LoadingMyAuctions() {
  return (
    <main
      aria-hidden="true"
      className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="h-12 w-64 animate-pulse rounded-soft bg-surface-muted motion-reduce:animate-none" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-soft bg-surface-muted motion-reduce:animate-none"
          />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-96 animate-pulse rounded-soft bg-surface-muted motion-reduce:animate-none"
          />
        ))}
      </div>
    </main>
  );
}
