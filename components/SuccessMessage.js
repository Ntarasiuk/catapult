export default function SuccessMessage({ children }) {
  return (
    <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] font-bold bg-acid text-ink px-3 py-2 border-2 border-ink">
      <span aria-hidden>✓</span>
      <span>{children}</span>
    </p>
  );
}
