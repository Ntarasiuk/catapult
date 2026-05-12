export default function ErrorMessage({ children }) {
  return (
    <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper bg-oxblood px-3 py-2 border border-oxblood">
      <span aria-hidden className="text-brass-soft">×</span>
      <span>{children}</span>
    </p>
  );
}
