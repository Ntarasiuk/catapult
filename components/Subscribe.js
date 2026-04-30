import { useRef, useState } from "react";
import ErrorMessage from "./ErrorMessage";
import LoadingSpinner from "./LoadingSpinner";
import SuccessMessage from "./SuccessMessage";

const TYPES = [
  { id: "Website", label: "Website" },
  { id: "SEO", label: "SEO" },
  { id: "AI", label: "AI" },
  { id: "Multiple", label: "All of it" },
];

export default function Subscribe() {
  const emailEl = useRef(null);
  const companyEl = useRef(null);
  const detailsEl = useRef(null);
  const [type, setType] = useState("Website");
  const [form, setForm] = useState({ state: "Initial" });

  const loading = form.state === "Loading";

  const submit = async (e) => {
    e.preventDefault();
    setForm({ state: "Loading" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailEl.current.value,
          company: companyEl.current.value,
          type,
          company_url: detailsEl.current.value,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setForm({
          state: "Error",
          message:
            (data && data.error && (data.error.message || data.error)) ||
            "Something went wrong. Please try again.",
        });
        return;
      }
      emailEl.current.value = "";
      companyEl.current.value = "";
      detailsEl.current.value = "";
      setForm({
        state: "Success",
        message: "Got it. We'll be in touch within two business days.",
      });
    } catch (err) {
      setForm({
        state: "Error",
        message: "Network error. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted font-bold">
        <span>{"// "}project_brief.txt</span>
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-acid-deep block animate-pulse" aria-hidden />
          Open
        </span>
      </div>
      <span className="rule" />

      <Field label="Email" required>
        <input
          ref={emailEl}
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          className="field"
          disabled={loading}
        />
      </Field>

      <Field label="Company">
        <input
          ref={companyEl}
          type="text"
          autoComplete="organization"
          placeholder="What you're working on"
          className="field"
          disabled={loading}
        />
      </Field>

      <div>
        <Label>What do you need?</Label>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              disabled={loading}
              data-active={type === t.id}
              className="chip"
              aria-pressed={type === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Field label="Project details">
        <textarea
          ref={detailsEl}
          rows={4}
          placeholder="A few sentences on goals, timeline, and what you've already tried."
          className="field"
          disabled={loading}
        />
      </Field>

      <div className="pt-4 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted font-bold">
          {"// "}Reply within 2 business days
        </p>
        <button
          type="submit"
          disabled={loading}
          className="btn-acid disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-none"
        >
          {loading ? (
            <>
              <LoadingSpinner />
              <span>Sending</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-ink block" aria-hidden />
              <span>Send brief</span>
              <span aria-hidden>→</span>
            </>
          )}
        </button>
      </div>

      <div className="min-h-[1.5rem]" aria-live="polite">
        {form.state === "Error" && <ErrorMessage>{form.message}</ErrorMessage>}
        {form.state === "Success" && (
          <SuccessMessage>{form.message}</SuccessMessage>
        )}
      </div>
    </form>
  );
}

function Label({ children }) {
  return (
    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted font-bold">
      {children}
    </span>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="flex flex-col gap-2.5">
      <Label>
        {label}
        {required && <span className="text-acid-deep">&nbsp;*</span>}
      </Label>
      {children}
    </label>
  );
}
