import { useRef, useState } from "react";
import ErrorMessage from "./ErrorMessage";
import LoadingSpinner from "./LoadingSpinner";
import SuccessMessage from "./SuccessMessage";

const TYPES = [
  { id: "Diligence", label: "Diligence" },
  { id: "100-Day", label: "100-Day" },
  { id: "Continuous", label: "Continuous" },
  { id: "Other", label: "Other" },
];

export default function Subscribe() {
  const emailEl = useRef(null);
  const companyEl = useRef(null);
  const detailsEl = useRef(null);
  const [type, setType] = useState("Diligence");
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
        message: "Received. We'll be in touch within two business days.",
      });
    } catch (err) {
      setForm({
        state: "Error",
        message: "Network error. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-7">
      <Field label="Email" required>
        <input
          ref={emailEl}
          type="email"
          autoComplete="email"
          required
          placeholder="you@firm.com"
          className="field"
          disabled={loading}
        />
      </Field>

      <Field label="Firm">
        <input
          ref={companyEl}
          type="text"
          autoComplete="organization"
          placeholder="Your firm or fund name"
          className="field"
          disabled={loading}
        />
      </Field>

      <div>
        <Label>Engagement type</Label>
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

      <Field label="Context">
        <textarea
          ref={detailsEl}
          rows={5}
          placeholder="A few sentences on the portfolio — thesis, hold period, what you'd want to see and ask first."
          className="field"
          disabled={loading}
        />
      </Field>

      <div className="pt-3 flex flex-col-reverse md:flex-row md:items-baseline md:justify-between gap-4 border-t border-[var(--rule)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-faint">
          Reply within two business days
        </p>
        <button type="submit" disabled={loading} className="cta disabled:opacity-40">
          {loading ? (
            <>
              <LoadingSpinner />
              <span>Sending</span>
            </>
          ) : (
            <>
              <span>Send</span>
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
    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-faint">
      {children}
    </span>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <label className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <Label>
          {label}
          {required && <span className="text-oxblood">&nbsp;*</span>}
        </Label>
        {hint && (
          <span className="italic text-[12.5px] text-ink-faint">
            {hint}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}
