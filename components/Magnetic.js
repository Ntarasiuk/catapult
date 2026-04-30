import { useEffect, useRef } from "react";

/**
 * Magnetic — wraps children in an element that translates toward the cursor
 * while hovered. Pair with the custom cursor for the "snap" feel.
 */
export default function Magnetic({
  children,
  strength = 0.28,
  radius = 120,
  className = "",
}) {
  const wrapRef = useRef(null);
  const innerRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    let raf;
    let active = false;

    const onMove = (e) => {
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius && !active) return;
      active = dist < radius;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const factor = active ? strength : 0;
        inner.style.transform = `translate3d(${dx * factor}px, ${
          dy * factor
        }px, 0)`;
      });
    };
    const onLeave = () => {
      active = false;
      cancelAnimationFrame(raf);
      inner.style.transform = "translate3d(0,0,0)";
    };

    window.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength, radius]);

  return (
    <span
      ref={wrapRef}
      data-magnetic
      className={`inline-block ${className}`}
      style={{ transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
    >
      <span
        ref={innerRef}
        className="inline-block"
        style={{ transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
      >
        {children}
      </span>
    </span>
  );
}
