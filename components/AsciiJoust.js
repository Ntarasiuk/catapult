import { useCallback, useEffect, useRef, useState } from "react";
import SPRITES from "components/joust-sprites.json";

/**
 * AsciiJoust — Joust-like rendered as monospace ASCII.
 * Sprites are CHR-extracted directly from the Joust.nes ROM (OAM tile groupings
 * captured by running the ROM through jsnes — see scripts/joust-extract-final.py).
 * Game logic, level layout, and physics are original (tuned to feel right).
 */

// Parse each sprite once into a 2D char array. " " = transparent.
const SPRITE_GRIDS = Object.fromEntries(
  Object.entries(SPRITES).map(([k, s]) => [k, s.split("\n").map((r) => r.split(""))])
);
const SPRITE_W = SPRITE_GRIDS.player_fly_right[0].length;
const PLAYER_H = SPRITE_GRIDS.player_fly_right.length;        // 6
const BUZZARD_H = SPRITE_GRIDS.buzzard_fly_a_right.length;    // 4

// Color codes (ints for fast equality compare). Mapped to CSS classes below.
const C_DEFAULT = 0;
const C_PLAYER  = 1;
const C_ENEMY   = 2;
const C_LAVA    = 3;
const C_LAVA_HI = 4;
const C_ROCK    = 5;
const C_ROCK_DK = 6;
const C_HUD     = 7;
const C_ACCENT  = 8;
const C_PUFF    = 9;
// Class names — index matches the constants above. Index 0 (default) emits no span.
const COLOR_CLASSES = [
  "",        // C_DEFAULT
  "c-player",
  "c-enemy",
  "c-lava",
  "c-lava-hi",
  "c-rock",
  "c-rock-dk",
  "c-hud",
  "c-accent",
  "c-puff",
];

const COLS = 160;
const ROWS = 48;
const HUD_ROWS = 1;

const FLOOR_Y = 38;
const BOTTOM_ROW = ROWS - 1;

// Layout extracted from Joust.nes nametable at frame 900 (gameplay).
// Each NES col → 5 grid cells; each NES row → 1.6 grid cells.
const PLATFORMS = [
  // Top tier (NES nametable row 9-10)
  { x: 0,    y: 14, w: 25 },   // top-left  — rows 9, cols 0-4
  { x: 45,   y: 16, w: 35 },   // top-center — row 10, cols 9-15
  { x: 135,  y: 14, w: 25 },   // top-right — row 9, cols 28-31
  // Mid tier (rows 15-16)
  { x: 0,    y: 26, w: 30 },   // mid-left  — row 16, cols 0-5
  { x: 115,  y: 24, w: 45 },   // mid-right — rows 15-16, cols 23-31
  // Mid-center (row 18)
  { x: 55,   y: 29, w: 35 },   // mid-center — row 18, cols 11-17
  // Continuous floor (no lava well — lava rises from below over waves)
  { x: 0,    y: FLOOR_Y, w: COLS },
];

// Lava rises from below the floor over waves.
// Waves 1-2: hidden (off-screen below grid).
// Waves 3+: rises 1 cell per wave starting at the bottom row.
function lavaTopRow(wave) {
  if (wave <= 2) return BOTTOM_ROW + 2; // off-screen, fully hidden
  const visible = wave - 2;             // wave 3 → 1 row visible at bottom
  return BOTTOM_ROW - visible + 1;
}

// Physics (cells per logic-step at 60Hz). Tuned against the NES ROM:
//   - Sustained-flap upward rate observed in jsnes attract mode: ~0.5 px/f
//     → ~0.10 cells/f (yscale = 48/240 = 0.2). With GRAVITY = 0.045 and
//     repeated FLAP_IMPULSE = -0.75 every ~14 frames, average rise ≈ 0.10/f.
//   - Horizontal max ≈ 1.5 NES px/f → ~0.95 cells/f (xscale = 0.625).
//   - Floor / platform Y values match nametable-extracted layout.
const GRAVITY = 0.045;
const MAX_FALL = 0.70;
const FLAP_IMPULSE = -0.78;
const ACCEL = 0.085;
const MAX_VX = 1.15;
const FRICTION_GROUND = 0.86;
const FRICTION_AIR = 0.995;
const RESPAWN_FRAMES = 90;
const RESPAWN_INVULN_FRAMES = 90;

// Fixed timestep — physics runs at this rate regardless of monitor refresh
const LOGIC_HZ = 60;
const LOGIC_DT_MS = 1000 / LOGIC_HZ;
const MAX_STEPS_PER_FRAME = 5; // anti-spiral-of-death

const KEY_MAP = {
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyA: "left",
  KeyD: "right",
  KeyW: "flap",
  Space: "flap",
  KeyJ: "flap",
};

function makeEntity(x, y, isPlayer, facing) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    facing: facing ?? 1,
    isPlayer: !!isPlayer,
    grounded: false,
    alive: true,
    deathFrames: 0,
    invulnFrames: isPlayer ? RESPAWN_INVULN_FRAMES : 0,
    h: isPlayer ? PLAYER_H : BUZZARD_H,
    w: SPRITE_W,
  };
}

function createGameState() {
  return {
    entities: [makeEntity(8, FLOOR_Y - 9, true, 1)],
    score: 0,
    lives: 3,
    wave: 1,
    pendingWave: 0, // frames until next wave spawn
    pendingRespawn: 0,
    gameOver: false,
    started: false,
    paused: false,
    ambient: true, // true until user takes control (immortal player, demo enemies)
    keys: { left: false, right: false },
    flapQueued: 0, // edge-triggered flap counter consumed in update
    frame: 0,
  };
}

function spawnWave(state) {
  const count = Math.min(1 + state.wave, 5);
  for (let i = 0; i < count; i++) {
    const x = ((i + 1) * COLS) / (count + 1);
    const y = 3 + (i % 2) * 2;
    const facing = i % 2 === 0 ? -1 : 1;
    state.entities.push(makeEntity(x, y, false, facing));
  }
}

// Wrap helper
function wrapX(x) {
  if (x < 0) return x + COLS;
  if (x >= COLS) return x - COLS;
  return x;
}

// Horizontal distance with wrap-around
function dxWrap(a, b) {
  let d = a - b;
  if (d > COLS / 2) d -= COLS;
  else if (d < -COLS / 2) d += COLS;
  return d;
}

function platformAt(x, fromY, wave) {
  // Returns y of the highest platform top that is at-or-below `fromY` in column x.
  // (i.e., the platform you'd land on if you were falling from fromY.)
  // Skips platforms submerged in risen lava — they're no longer safe to stand on.
  const cx = Math.floor(x);
  const lavaTop = lavaTopRow(wave);
  let best = null;
  for (const p of PLATFORMS) {
    if (p.y >= lavaTop) continue; // submerged
    if (cx >= p.x && cx < p.x + p.w && p.y >= fromY - 0.001) {
      if (best === null || p.y < best) best = p.y;
    }
  }
  return best;
}

function inLava(x, y, wave) {
  return y >= lavaTopRow(wave);
}

function updateEntity(e, state) {
  if (!e.alive) {
    e.deathFrames++;
    return;
  }
  if (e.invulnFrames > 0) e.invulnFrames--;

  // ---- Input / AI ----
  let xInput = false;
  if (e.isPlayer) {
    if (state.keys.left)  { e.vx -= ACCEL; e.facing = -1; xInput = true; }
    if (state.keys.right) { e.vx += ACCEL; e.facing = 1; xInput = true; }
    while (state.flapQueued > 0) {
      e.vy = FLAP_IMPULSE;
      e.grounded = false;
      state.flapQueued--;
    }
  } else {
    // Simple AI: chase player, try to be slightly higher
    const player = state.entities[0];
    if (player && player.alive) {
      const dx = dxWrap(player.x, e.x);
      if (dx > 0.5) { e.vx += ACCEL * 0.6; e.facing = 1; xInput = true; }
      else if (dx < -0.5) { e.vx -= ACCEL * 0.6; e.facing = -1; xInput = true; }
      // Flap occasionally to climb above player
      const wantHigher = e.y > player.y - 1.5;
      if (wantHigher && Math.random() < 0.04) {
        e.vy = FLAP_IMPULSE * 0.8;
        e.grounded = false;
      } else if (Math.random() < 0.008) {
        e.vy = FLAP_IMPULSE * 0.65;
        e.grounded = false;
      }
    }
  }
  // Stash input flag for the friction step below
  e._xInput = xInput;

  // ---- Physics ----
  e.vy += GRAVITY;
  if (e.vy > MAX_FALL) e.vy = MAX_FALL;
  if (e.vx > MAX_VX) e.vx = MAX_VX;
  if (e.vx < -MAX_VX) e.vx = -MAX_VX;

  const prevY = e.y;
  e.x = wrapX(e.x + e.vx);
  e.y += e.vy;

  // ---- Platform collision ----
  // Sprite occupies (x..x+w, y..y+h). Foot column is at x + w/2.
  const footX = e.x + e.w / 2;
  const prevBottom = prevY + e.h;
  const riderBottom = e.y + e.h;
  // Only consider platforms at-or-below where we WERE — prevents being yanked up
  // onto platforms that float above the current path.
  const platY = platformAt(footX, prevBottom, state.wave);
  if (platY !== null && e.vy >= 0 && riderBottom >= platY) {
    e.y = platY - e.h;
    e.vy = 0;
    e.grounded = true;
  }
  if (e.grounded) {
    // Still on if there's a platform exactly at the current foot row
    const standingOn = platformAt(footX, e.y + e.h - 0.5, state.wave);
    if (standingOn === null || Math.abs(standingOn - (e.y + e.h)) > 0.5) {
      e.grounded = false;
    }
  }
  // Friction only when no horizontal input — otherwise it caps you below MAX_VX.
  if (!e._xInput) {
    e.vx *= e.grounded ? FRICTION_GROUND : FRICTION_AIR;
  }

  // ---- Lava ----
  if (inLava(e.x + e.w / 2, e.y + e.h, state.wave)) {
    if (!(state.ambient && e.isPlayer)) {
      e.alive = false;
      e.deathFrames = 0;
    }
  }

  // ---- World bounds (top) ----
  if (e.y < 1) { e.y = 1; if (e.vy < 0) e.vy = 0; }
}

function resolveJousts(state) {
  const ents = state.entities;
  for (let i = 0; i < ents.length; i++) {
    const a = ents[i];
    if (!a.alive) continue;
    for (let j = i + 1; j < ents.length; j++) {
      const b = ents[j];
      if (!b.alive) continue;
      // Ambient mode: player can't die; just bounce off enemies.
      if (state.ambient && (a.isPlayer || b.isPlayer)) continue;
      // Skip lethal interaction if either side is in respawn invuln
      if (a.invulnFrames > 0 || b.invulnFrames > 0) continue;
      // Compare sprite-center positions
      const dx = Math.abs(dxWrap(a.x + a.w / 2, b.x + b.w / 2));
      const dy = Math.abs((a.y + a.h / 2) - (b.y + b.h / 2));
      if (dx < (a.w + b.w) / 2.5 && dy < (a.h + b.h) / 2.5) {
        // Joust!
        const diff = a.y - b.y; // negative = a is higher (smaller y)
        if (Math.abs(diff) < 0.45) {
          // Bounce — swap and damp
          const tmp = a.vx;
          a.vx = b.vx * 0.7;
          b.vx = tmp * 0.7;
          // Shove apart so we don't re-collide next frame
          if (dxWrap(a.x, b.x) > 0) { a.x = wrapX(a.x + 0.6); b.x = wrapX(b.x - 0.6); }
          else                       { a.x = wrapX(a.x - 0.6); b.x = wrapX(b.x + 0.6); }
        } else if (diff < 0) {
          // a is higher → a wins
          killOutcome(state, a, b);
        } else {
          killOutcome(state, b, a);
        }
      }
    }
  }
}

function killOutcome(state, winner, loser) {
  loser.alive = false;
  loser.deathFrames = 0;
  if (loser.isPlayer) {
    state.lives--;
    if (state.lives <= 0) {
      state.gameOver = true;
    } else {
      state.pendingRespawn = RESPAWN_FRAMES;
    }
  } else {
    state.score += 750;
  }
}

function maybeAdvanceWave(state) {
  const enemiesAlive = state.entities.some((e) => !e.isPlayer && e.alive);
  if (enemiesAlive) return;
  if (state.pendingWave === 0) {
    state.pendingWave = 90;
  } else {
    state.pendingWave--;
    if (state.pendingWave === 0) {
      state.entities = state.entities.filter((e) => e.isPlayer || e.alive);
      state.wave++;
      spawnWave(state);
    }
  }
}

function maybeRespawnPlayer(state) {
  const player = state.entities[0];
  if (!player) return;
  if (!player.alive && !state.gameOver) {
    if (state.pendingRespawn > 0) {
      state.pendingRespawn--;
      if (state.pendingRespawn === 0) {
        player.alive = true;
        player.x = 8;
        player.y = FLOOR_Y - 9;
        player.vx = 0;
        player.vy = 0;
        player.facing = 1;
        player.invulnFrames = RESPAWN_INVULN_FRAMES;
      }
    }
  }
}

// ---- Render ----
function renderFrame(state) {
  const totalRows = ROWS + HUD_ROWS;
  const grid = new Array(totalRows);
  const colors = new Array(totalRows);
  for (let y = 0; y < totalRows; y++) {
    grid[y] = new Array(COLS).fill(" ");
    colors[y] = new Array(COLS).fill(C_DEFAULT);
  }

  // HUD
  const lavaWarn = state.wave >= 6 ? "  · LAVA RISING" : state.wave >= 3 ? "  · lava troll stirs" : "";
  const hud =
    ` SCORE ${String(state.score).padStart(6, "0")}` +
    `   LIVES ${"#".repeat(Math.max(0, state.lives))}${"-".repeat(Math.max(0, 3 - state.lives))}` +
    `   WAVE ${String(state.wave).padStart(2, "0")}${lavaWarn}` +
    `   ${state.gameOver ? "GAME OVER · ENTER TO RESTART" : "WASD/← →  ·  J/SPACE FLAP"}`;
  for (let i = 0; i < Math.min(hud.length, COLS); i++) {
    grid[0][i] = hud[i];
    colors[0][i] = C_HUD;
  }
  for (let i = 0; i < COLS; i++) {
    if (grid[0][i] === " ") {
      grid[0][i] = ".";
      colors[0][i] = C_HUD;
    }
  }

  const yOff = HUD_ROWS;
  const lavaTop = lavaTopRow(state.wave);

  // Wave-rising lava (drawn from lavaTop down to the bottom row)
  for (let y = lavaTop; y <= BOTTOM_ROW; y++) {
    const gy = y + yOff;
    if (gy < 0 || gy >= grid.length) continue;
    for (let x = 0; x < COLS; x++) {
      const t = (state.frame + x * 5 + y * 3) % 11;
      const c = t < 4 ? "~" : t < 7 ? "=" : t < 9 ? "^" : ".";
      grid[gy][x] = c;
      // Brighter top edge of the lava reads as molten / glowing
      colors[gy][x] = (y === lavaTop || t >= 9) ? C_LAVA_HI : C_LAVA;
    }
  }

  // Platforms (skip cells eaten by risen lava)
  for (const p of PLATFORMS) {
    if (p.y >= lavaTop) continue;
    for (let x = p.x; x < p.x + p.w; x++) {
      if (x < 0 || x >= COLS) continue;
      const gy = p.y + yOff;
      if (gy < grid.length) {
        grid[gy][x] = "=";
        colors[gy][x] = C_ROCK;
      }
    }
    for (let yShade = 1; yShade <= 3; yShade++) {
      const gy = p.y + yOff + yShade;
      if (gy >= grid.length) break;
      if (p.y + yShade >= lavaTop) break;
      for (let x = p.x; x < p.x + p.w; x++) {
        if (x < 0 || x >= COLS) continue;
        if (grid[gy][x] === " ") {
          grid[gy][x] = yShade === 1 ? "-" : yShade === 2 ? "." : " ";
          colors[gy][x] = C_ROCK_DK;
        }
      }
    }
  }

  // Entities
  for (const e of state.entities) {
    if (!e.alive) {
      if (e.deathFrames < 24) {
        const cx = Math.round(e.x);
        const cy = Math.round(e.y) + yOff;
        const puff = e.deathFrames < 12 ? "*" : ".";
        for (let dy = 0; dy < e.h; dy++) {
          for (let dx = 0; dx < e.w; dx++) {
            const gx = wrapX(cx + dx);
            const gy = cy + dy;
            if (gy >= 0 && gy < grid.length) {
              grid[gy][gx] = puff;
              colors[gy][gx] = C_PUFF;
            }
          }
        }
      }
      continue;
    }
    if (e.invulnFrames > 0 && Math.floor(e.invulnFrames / 4) % 2 === 0) continue;
    drawSprite(grid, colors, e, yOff, state.frame);
  }

  // Game over / start banner
  let banner = null;
  if (state.gameOver) banner = "  GAME  OVER  ";
  else if (!state.started) banner = "  PRESS  ENTER  TO  START  ";
  if (banner) {
    const cx = Math.floor((COLS - banner.length) / 2);
    const cy = Math.floor((ROWS + HUD_ROWS) / 2);
    for (let i = 0; i < banner.length; i++) {
      grid[cy][cx + i] = banner[i];
      colors[cy][cx + i] = C_ACCENT;
    }
  }

  return buildHTML(grid, colors);
}

// Build HTML with run-length-encoded colored spans. Most cells are default
// (no span), and consecutive same-color cells share one span tag.
function buildHTML(grid, colors) {
  const rows = grid.length;
  const lines = new Array(rows);
  for (let y = 0; y < rows; y++) {
    const row = grid[y];
    const rc = colors[y];
    let line = "";
    let curC = -1;
    let buf = "";
    for (let x = 0; x < row.length; x++) {
      const c = rc[x];
      if (c !== curC) {
        if (buf) {
          line += curC === C_DEFAULT ? buf : `<span class="${COLOR_CLASSES[curC]}">${buf}</span>`;
        }
        buf = "";
        curC = c;
      }
      buf += row[x];
    }
    if (buf) {
      line += curC === C_DEFAULT ? buf : `<span class="${COLOR_CLASSES[curC]}">${buf}</span>`;
    }
    lines[y] = line;
  }
  return lines.join("\n");
}

function drawSprite(grid, colors, e, yOff, frame) {
  const cx = Math.round(e.x);
  const cy = Math.round(e.y) + yOff;
  const dir = e.facing === 1 ? "_right" : "_left";

  let name;
  if (e.isPlayer) {
    if (e.grounded) {
      const moving = Math.abs(e.vx) > 0.05;
      name = moving && Math.floor(frame / 6) % 2 === 0 ? "player_stand_b" : "player_stand_a";
    } else {
      name = "player_fly";
    }
  } else {
    name = Math.floor(frame / 5) % 2 === 0 ? "buzzard_fly_a" : "buzzard_fly_b";
  }

  const sprite = SPRITE_GRIDS[name + dir];
  if (!sprite) return;
  const colorCode = e.isPlayer ? C_PLAYER : C_ENEMY;
  for (let r = 0; r < sprite.length; r++) {
    const row = sprite[r];
    const gy = cy + r;
    if (gy < 0 || gy >= grid.length) continue;
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === " ") continue; // transparent
      const gx = wrapX(cx + c);
      grid[gy][gx] = ch;
      colors[gy][gx] = colorCode;
    }
  }
}

export default function AsciiJoust() {
  const preRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const [hudTick, setHudTick] = useState(0); // forces re-render of overlay UI
  const [focused, setFocused] = useState(false);

  // Initialize state once
  if (stateRef.current === null) {
    stateRef.current = createGameState();
  }

  const start = useCallback(() => {
    const s = stateRef.current;
    Object.assign(s, createGameState());
    s.started = true;
    spawnWave(s);
    setHudTick((n) => n + 1);
  }, []);

  // Auto-start the game on mount so it acts as an ambient hero background.
  useEffect(() => {
    if (!stateRef.current.started) start();
  }, [start]);

  // Game loop — fixed-step physics @ 60Hz, RAF render rate matches monitor
  useEffect(() => {
    let running = true;
    let lastTime = performance.now();
    let accumulator = 0;
    const tick = (now) => {
      if (!running) return;
      const s = stateRef.current;
      let delta = now - lastTime;
      lastTime = now;
      if (delta > 250) delta = 250; // window-blur catch-up cap
      accumulator += delta;
      let steps = 0;
      while (accumulator >= LOGIC_DT_MS && steps < MAX_STEPS_PER_FRAME) {
        s.frame++;
        if (s.started && !s.gameOver && !s.paused) {
          for (const e of s.entities) updateEntity(e, s);
          resolveJousts(s);
          maybeRespawnPlayer(s);
          maybeAdvanceWave(s);
        }
        accumulator -= LOGIC_DT_MS;
        steps++;
      }
      // Drop accumulated lag if we're hopelessly behind
      if (accumulator > LOGIC_DT_MS * MAX_STEPS_PER_FRAME) {
        accumulator = 0;
      }
      const html = renderFrame(s);
      if (preRef.current) preRef.current.innerHTML = html;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Pause when tab hidden
  useEffect(() => {
    const onVis = () => {
      if (!stateRef.current) return;
      stateRef.current.paused = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Keyboard input — only when the play surface is focused
  useEffect(() => {
    if (!focused) return;
    const onDown = (e) => {
      const s = stateRef.current;
      if (!s) return;
      if (e.code === "Enter") {
        e.preventDefault();
        if (!s.started || s.gameOver) start();
        return;
      }
      const action = KEY_MAP[e.code];
      if (!action) return;
      e.preventDefault();
      if (action === "flap") {
        s.flapQueued = Math.min(s.flapQueued + 1, 3);
      } else {
        s.keys[action] = true;
      }
    };
    const onUp = (e) => {
      const s = stateRef.current;
      if (!s) return;
      const action = KEY_MAP[e.code];
      if (!action || action === "flap") return;
      e.preventDefault();
      s.keys[action] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [focused, start]);

  return (
    <div className="joust-game-wrap absolute inset-0 flex items-center justify-center select-none">
      <pre
        ref={preRef}
        tabIndex={0}
        onFocus={() => {
          setFocused(true);
          const s = stateRef.current;
          if (s) {
            // Leaving ambient: enemies & lava become deadly.
            s.ambient = false;
            if (!s.started || s.gameOver) start();
          }
        }}
        onBlur={() => setFocused(false)}
        onClick={() => preRef.current?.focus()}
        className={`joust-game-screen m-0 leading-none whitespace-pre text-ink outline-none transition-opacity duration-300 ${
          focused ? "opacity-100" : "opacity-40"
        }`}
        aria-label="Background ASCII Joust — click to play"
        role="application"
      />
    </div>
  );
}
