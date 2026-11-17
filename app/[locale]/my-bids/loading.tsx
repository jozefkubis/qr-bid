export default function LoadingMyBids() {
  return (
    <main
      aria-hidden="true"
      className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="h-12 w-56 animate-pulse rounded-soft bg-surface-muted motion-reduce:animate-none" />
      <div className="mt-4 h-6 w-full max-w-xl animate-pulse rounded-soft bg-surface-muted motion-reduce:animate-none" />
      <div className="mt-8 grid gap-5">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-soft bg-surface-muted motion-reduce:animate-none md:h-44"
          />
        ))}
      </div>
    </main>
  );
}
