import { useRef, useState } from "react";
import ErrorMessage from "./ErrorMessage";
import LoadingSpinner from "./LoadingSpinner";
import SuccessMessage from "./SuccessMessage";

export default function Subscribe() {
  const emailEl = useRef(null);
  const companyEl = useRef(null);
  const urlEl = useRef(null);
  const [form, setForm] = useState({ state: "Initial" });
  const [type, setType] = useState("Recruiter");

  const subscribe = async (e) => {
    e.preventDefault();
    setForm({ state: "Loading" });

    const res = await fetch("/api/subscribe", {
      body: JSON.stringify({
        email: emailEl.current.value,
        company: companyEl.current.value,
        type,
        company_url: urlEl.current.value,
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

    emailEl.current.value = "";
    companyEl.current.value = "";
    urlEl.current.value = "";
    setForm({
      state: "Success",
      message: `Hooray! You're now on the list.`,
    });
  };
  return (
    <div className="border border-blue-200 rounded p-6 my-4 w-full dark:border-gray-800 bg-blue-50 dark:bg-blue-opaque">
      <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
        Contact us
      </p>
      <p className="my-1 text-gray-800 dark:text-gray-200">
        Find out how you can take the guesswork out of recruiting
      </p>
      <form className="relative my-4" onSubmit={subscribe}>
        <input
          ref={emailEl}
          aria-label="Email for newsletter"
          placeholder="Email"
          type="email"
          autoComplete="email"
          required
          className="px-4 py-2 mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 pr-32"
        />
        <input
          ref={companyEl}
          aria-label="Company"
          placeholder="Company"
          type="text"
          autoComplete="company"
          className="px-4 py-2 mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 pr-32"
        />
        <input
          ref={urlEl}
          aria-label="Website"
          placeholder="Website"
          type="url"
          autoComplete="website"
          className="px-4 py-2 mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 pr-32"
        />
        <div className="inline-flex rounded-md shadow-sm my-2" role="group">
          <button
            onClick={() => setType("Recruiter")}
            type="button"
            className={`py-2 px-4 text-sm font-medium  ${
              type === "Recruiter"
                ? "bg-blue-500 dark:bg-blue-500 hover:bg-blue-500 dark:hover:bg-blue-600 focus:text-white dark:text-white text-white"
                : "bg-white dark:bg-gray-700 hover:bg-gray-100 text-gray-900 dark:text-white"
            }  rounded-l-lg border border-gray-200  hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700   dark:border-gray-600  dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500`}
          >
            Recruiter
          </button>

          <button
            onClick={() => setType("Developer")}
            type="button"
            className={` ${
              type === "Developer"
                ? "bg-blue-500 dark:bg-blue-500 hover:bg-blue-500 dark:hover:bg-blue-600 focus:text-white dark:text-white text-white"
                : "bg-white dark:bg-gray-700 hover:bg-gray-100 text-gray-900 dark:text-white"
            }
            py-2 px-4 text-sm font-medium   rounded-r-md border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white  dark:focus:ring-blue-500 dark:focus:text-white`}
          >
            Developer
          </button>
        </div>
        <button
          className="flex items-center justify-center my-4 px-4 font-medium h-10 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded w-28"
          type="submit"
        >
          {"state" === "Loading" ? <LoadingSpinner /> : "Contact"}
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

