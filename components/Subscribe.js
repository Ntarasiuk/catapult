import { useRef, useState } from "react";
import ErrorMessage from "./ErrorMessage";
import LoadingSpinner from "./LoadingSpinner";
import SuccessMessage from "./SuccessMessage";

export default function Subscribe() {
  const inputEl = useRef(null);
  const [form, setForm] = useState({ state: "Initial" });

  const subscribe = async (e) => {
    e.preventDefault();
    setForm({ state: "Loading" });

    const res = await fetch("/api/subscribe", {
      body: JSON.stringify({
        email: inputEl.current.value,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const { error } = await res.json();
    if (error) {
      setForm({
        state: "Error",
        message: error,
      });
      return;
    }

    inputEl.current.value = "";
    setForm({
      state: "Success",
      message: `Hooray! You're now on the list.`,
    });
  };
  return (
    <div className="border border-blue-200 rounded p-6 my-4 w-full dark:border-gray-800 bg-blue-50 dark:bg-blue-opaque">
      <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
        Subscribe to the newsletter
      </p>
      <p className="my-1 text-gray-800 dark:text-gray-200">
        Get emails from me about web development, tech, and early access to new
        articles.
      </p>
      <form className="relative my-4" onSubmit={subscribe}>
        <input
          ref={inputEl}
          aria-label="Email for newsletter"
          placeholder="tim@apple.com"
          type="email"
          autoComplete="email"
          required
          className="px-4 py-2 mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 pr-32"
        />
        <button
          className="flex items-center justify-center absolute right-1 top-1 px-4 pt-1 font-medium h-8 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded w-28"
          type="submit"
        >
          {"state" === "Loading" ? <LoadingSpinner /> : "Subscribe"}
        </button>
      </form>
      {form.state === "Error" ? (
        <ErrorMessage>{form.message}</ErrorMessage>
      ) : form.state === "Success" ? (
        <SuccessMessage>{form.message}</SuccessMessage>
      ) : null}
    </div>
  );
}
