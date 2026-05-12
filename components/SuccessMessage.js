export default function SuccessMessage({ children }) {
  return (
    <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper bg-ink px-3 py-2 border border-ink">
      <span aria-hidden className="text-brass">✓</span>
      <span>{children}</span>
    </p>
  );
}
