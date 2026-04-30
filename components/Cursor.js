import { useEffect, useRef, useState } from "react";

const HOVER_SELECTOR =
  'a, button, input, textarea, [role="button"], [data-cursor], [data-magnetic]';
const TEXT_SELECTOR = "[data-cursor='text']";

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState({ hover: false, text: false, pressed: false });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const fine = window.matchMedia?.("(hover: hover) and (pointer: fine)");
    if (fine && !fine.matches) return;

    setMounted(true);

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let raf;

    const tick = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
    };
    const onOver = (e) => {
      const t = e.target;
      if (t && t.closest && t.closest(TEXT_SELECTOR)) {
        setState((s) => ({ ...s, text: true, hover: false }));
      } else if (t && t.closest && t.closest(HOVER_SELECTOR)) {
        setState((s) => ({ ...s, hover: true, text: false }));
      } else {
        setState((s) => ({ ...s, hover: false, text: false }));
      }
    };
    const onDown = () => setState((s) => ({ ...s, pressed: true }));
    const onUp = () => setState((s) => ({ ...s, pressed: false }));
    const onLeave = () => {
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };
    const onEnter = () => {
      if (dotRef.current) dotRef.current.style.opacity = "1";
      if (ringRef.current) ringRef.current.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseover", onOver);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!mounted) return null;

  const ringClass = [
    "cursor-ring",
    state.hover ? "is-hover" : "",
    state.text ? "is-text" : "",
    state.pressed ? "is-pressed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden />
      <div ref={ringRef} className={ringClass} aria-hidden />
    </>
  );
}
