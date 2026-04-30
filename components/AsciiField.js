import { useEffect, useRef, useState } from "react";

const DENSITY = " .·:-=+*#%@";
const NOISE_CHARS = " .·:-=+*<>/\\|!?#%@☄";
const SUPERSAMPLE = 2;

/* Deterministic 3D hash → [0, 1). Stable per (x, y, t), so disruption cells
   produce coherent values across frames within the same tick window. */
function hash3(x, y, t) {
  let n =
    ((x | 0) * 374761393 + (y | 0) * 668265263 + (t | 0) * 1442695040) | 0;
  n = ((n ^ (n >>> 13)) * 1274126177) | 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

/**
 * AsciiField
 * --------------------------------------------------------------------------
 * Renders `text` as a live monospace character grid:
 *   1. The text is drawn to an offscreen canvas at the chosen weight/family.
 *   2. The canvas pixels are downsampled into a density mask (cols × rows).
 *   3. A requestAnimationFrame loop renders the mask into a <pre> element,
 *      mapping density to characters from light → dense.
 *   4. A subtle sinusoidal breathing animation modulates each cell.
 *   5. Whenever the cursor is on the page, cells inside `haloRadius` get
 *      replaced with random NOISE_CHARS — a chaotic disruption field that
 *      destabilises the letterforms wherever the pointer hovers.
 *
 * The grid resolution adapts to viewport width, and font-size auto-scales
 * via ResizeObserver so the grid always fills its container exactly.
 */
export default function AsciiField({
  text,
  className = "",
  style,
  weight = 900,
  family = '"Big Shoulders Display", Impact, sans-serif',
  haloRadius = 11,
  charClass = "text-ink",
  /* How often (per second) the cursor disruption re-rolls each cell.
     ~3 feels purposeful; >8 starts to feel like noise. */
  disruptionRate = 3,
}) {
  const wrapRef = useRef(null);
  const preRef = useRef(null);
  const maskRef = useRef(null);
  const charGridRef = useRef(null);
  const cursorRef = useRef({ x: -9999, y: -9999, has: false });
  const reducedMotionRef = useRef(false);
  const [grid, setGrid] = useState({ cols: 96, rows: 22 });
  const [charRatio, setCharRatio] = useState(0.6);

  /* `cols` is picked off viewport width; `rows` is derived from the wrap's
     actual height so the grid fills its container vertically too. The
     ResizeObserver below handles both — this effect just sets a sensible
     SSR default. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window.innerWidth;
    if (w < 640) setGrid((p) => ({ ...p, cols: 46 }));
    else if (w < 1024) setGrid((p) => ({ ...p, cols: 74 }));
    else if (w < 1440) setGrid((p) => ({ ...p, cols: 100 }));
    else setGrid((p) => ({ ...p, cols: 118 }));
  }, []);

  /* prefers-reduced-motion */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = m.matches;
    const onChange = () => {
      reducedMotionRef.current = m.matches;
    };
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, []);

  /* measure the actual mono font character aspect ratio once */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.font = `400 16px "Space Mono", ui-monospace, monospace`;
    const m = ctx.measureText("M");
    if (m.width > 0) setCharRatio(m.width / 16);
  }, []);

  /* Combined sizing: derive cols (width) and rows (height) from the wrap's
     actual rect, set the pre's font-size so the grid exactly fills the
     container in both axes. Triggers a mask rebuild when grid changes. */
  useEffect(() => {
    const wrap = wrapRef.current;
    const pre = preRef.current;
    if (!wrap || !pre) return;
    const lineHeight = 0.95;

    const apply = (w, h) => {
      if (w <= 0 || h <= 0) return;
      let cols;
      if (w < 640) cols = 46;
      else if (w < 1024) cols = 74;
      else if (w < 1440) cols = 100;
      else cols = 118;

      const fontSize = w / cols / charRatio;
      const cellHeight = fontSize * lineHeight;
      const rows = Math.max(8, Math.floor(h / cellHeight));

      pre.style.fontSize = `${fontSize}px`;
      setGrid((prev) =>
        prev.cols === cols && prev.rows === rows ? prev : { cols, rows }
      );
    };

    const rect = wrap.getBoundingClientRect();
    apply(rect.width, rect.height);

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      apply(cr.width, cr.height);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [charRatio]);

  /* prefill <pre> with whitespace so layout is stable before first frame */
  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;
    pre.textContent = (" ".repeat(grid.cols) + "\n").repeat(grid.rows);
  }, [grid]);

  /* build mask from canvas-rendered text — supersampled (2x) and auto-fit to
     canvas width. Also builds a parallel char-grid: for each cell that lies
     inside a glyph's x-range, store the source character so the render loop
     can emit "C" cells inside the C, "A" cells inside the A, and so on. */
  useEffect(() => {
    const { cols, rows } = grid;
    const buildMask = () => {
      const canvas = document.createElement("canvas");
      canvas.width = cols * SUPERSAMPLE;
      canvas.height = rows * 2 * SUPERSAMPLE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";

      const lines = text.split("\n");
      let fontSize = Math.floor((canvas.height / lines.length) * 0.94);
      ctx.font = `${weight} ${fontSize}px ${family}`;
      let maxLineWidth = 0;
      for (const line of lines) {
        maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
      }
      const targetWidth = canvas.width * 0.94;
      if (maxLineWidth > targetWidth && maxLineWidth > 0) {
        fontSize = Math.max(8, Math.floor((fontSize * targetWidth) / maxLineWidth));
        ctx.font = `${weight} ${fontSize}px ${family}`;
      }

      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      const lineH = canvas.height / lines.length;
      const charGrid = new Array(cols * rows).fill(" ");

      lines.forEach((line, lineIdx) => {
        const lineW = ctx.measureText(line).width;
        let cursorX = (canvas.width - lineW) / 2;
        const yPos = lineH * (lineIdx + 0.5);
        const rowStart = Math.floor((lineIdx / lines.length) * rows);
        const rowEnd = Math.ceil(((lineIdx + 1) / lines.length) * rows);
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          const charW = ctx.measureText(ch).width;
          ctx.fillText(ch, cursorX, yPos);
          if (ch !== " ") {
            const cStart = Math.max(0, Math.floor(cursorX / SUPERSAMPLE));
            const cEnd = Math.min(
              cols,
              Math.ceil((cursorX + charW) / SUPERSAMPLE)
            );
            for (let r = rowStart; r < rowEnd; r++) {
              for (let c = cStart; c < cEnd; c++) {
                charGrid[r * cols + c] = ch;
              }
            }
          }
          cursorX += charW;
        }
      });

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const mask = new Float32Array(cols * rows);
      const samplesPerCell = 2 * SUPERSAMPLE * SUPERSAMPLE;
      for (let r = 0; r < rows; r++) {
        for (let cc = 0; cc < cols; cc++) {
          const px = cc * SUPERSAMPLE;
          const py = r * 2 * SUPERSAMPLE;
          let total = 0;
          for (let dy = 0; dy < 2 * SUPERSAMPLE; dy++) {
            for (let dx = 0; dx < SUPERSAMPLE; dx++) {
              const idx = ((py + dy) * canvas.width + (px + dx)) * 4;
              total += data[idx];
            }
          }
          mask[r * cols + cc] = total / (samplesPerCell * 255);
        }
      }
      maskRef.current = mask;
      charGridRef.current = charGrid;
    };
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(buildMask).catch(buildMask);
    } else {
      buildMask();
    }
  }, [text, grid, weight, family]);

  /* track cursor in cell coords — measure against the <pre>, not the wrap.
     The wrap can be sized arbitrarily by the parent (e.g. w-full h-full
     for a background layer); the <pre> always reflects the actual rendered
     grid, so its bounding rect is the right basis for cell math. */
  useEffect(() => {
    const onMove = (e) => {
      const el = preRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const cellW = rect.width / grid.cols;
      const cellH = rect.height / grid.rows;
      cursorRef.current = {
        x: (e.clientX - rect.left) / cellW,
        y: (e.clientY - rect.top) / cellH,
        has: true,
      };
    };
    const onLeave = () => {
      cursorRef.current = { x: -9999, y: -9999, has: false };
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, [grid]);

  /* render loop */
  useEffect(() => {
    let raf;
    const start = (typeof performance !== "undefined" ? performance.now() : Date.now());
    const tick = (now) => {
      const elapsed = (now - start) / 1000; // seconds
      const t = elapsed * 3.6; // legacy time scale used by the wave maths
      const mask = maskRef.current;
      const pre = preRef.current;
      if (!mask || !pre) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const { cols, rows } = grid;
      const cur = cursorRef.current;
      const reduced = reducedMotionRef.current;

      /* Slow, deterministic noise tick — characters in the disruption halo
         change at `disruptionRate` Hz instead of every frame. */
      const noiseTick = Math.floor(elapsed * disruptionRate);

      const charGrid = charGridRef.current;
      let out = "";
      for (let r = 0; r < rows; r++) {
        for (let cc = 0; cc < cols; cc++) {
          const m = mask[r * cols + cc] || 0;
          const letter = charGrid ? charGrid[r * cols + cc] : " ";

          /* Cursor halo distance — calculated once, used for both disruption
             and ambient density boost. */
          let inHalo = false;
          let prox = 0;
          if (!reduced && cur.has) {
            const dx = cc - cur.x;
            const dy = (r - cur.y) * 2.05;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < haloRadius) {
              inHalo = true;
              prox = 1 - dist / haloRadius;
            }
          }

          /* Slow disruption — overrides everything else, including letters,
             so the cursor visibly dissolves the wordmark. */
          if (inHalo) {
            const r1 = hash3(cc, r, noiseTick);
            if (r1 < prox * 0.7) {
              const r2 = hash3(cc, r, noiseTick + 9973);
              out += NOISE_CHARS[Math.floor(r2 * NOISE_CHARS.length)];
              continue;
            }
          }

          /* Letter cell: emit the source character at uniform density.
             Threshold of 0.3 keeps letterforms crisp against the ambient
             background. */
          if (m > 0.3 && letter !== " ") {
            out += letter;
            continue;
          }

          /* Ambient: wave + breathing + halo additive */
          const wave =
            (Math.sin(t * 0.45 + cc * 0.13 + r * 0.08) * 0.5 + 0.5) * 0.18;
          let v = Math.max(m * 0.95, wave);
          if (!reduced) {
            v += Math.sin(t * 0.85 + cc * 0.18 + r * 0.24) * 0.05;
            if (inHalo) v += prox * 0.45;
          }
          v = v < 0 ? 0 : v > 0.999 ? 0.999 : v;
          out += DENSITY[Math.floor(v * DENSITY.length)];
        }
        out += "\n";
      }
      pre.textContent = out;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [grid, haloRadius, disruptionRate]);

  return (
    <div
      ref={wrapRef}
      className={className}
      role="img"
      aria-label={text}
      data-cursor="text"
      style={style}
    >
      <pre
        ref={preRef}
        className={`${charClass} font-mono select-none whitespace-pre`}
        style={{
          margin: 0,
          lineHeight: 0.95,
          letterSpacing: 0,
          fontFeatureSettings: '"liga" 0',
        }}
      />
    </div>
  );
}
