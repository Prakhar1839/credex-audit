// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen grid-bg flex items-center justify-center px-4">
      <div className="text-center">
        <div className="font-mono text-text-muted text-sm mb-4">404</div>
        <h1 className="font-display font-800 text-3xl text-text-primary mb-3">
          Audit not found
        </h1>
        <p className="text-text-secondary text-sm mb-8 max-w-xs mx-auto">
          This audit link may have expired or never existed. Run a new audit — it only takes 2 minutes.
        </p>
        <Link href="/" className="btn-primary">
          Run a free audit →
        </Link>
      </div>
    </main>
  );
}
