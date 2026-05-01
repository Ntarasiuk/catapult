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
const SPRITE_W = SPRITE_GRIDS.player_fly_right[0].length;       // 12
const PLAYER_H = SPRITE_GRIDS.player_fly_right.length;          // 9
const BUZZARD_H = SPRITE_GRIDS.buzzard_fly_a_right.length;      // 8 (incl. legs)

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
const C_KNIGHT  = 10;
const C_EGG     = 11;
const C_BOUNDER = 12;       // beige Bounder enemy variant
const C_HUNTER  = 13;       // red Hunter (same as C_ENEMY but kept distinct)
const C_SHADOW  = 14;       // gray Shadow Lord
const C_PTERO   = 15;       // pterodactyl crimson
const C_PTERO_HI = 16;      // pterodactyl mouth (when open = killable)
const C_TROLL   = 17;
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
  "c-knight",
  "c-egg",
  "c-bounder",
  "c-hunter",
  "c-shadow",
  "c-ptero",
  "c-ptero-hi",
  "c-troll",
];

// How many top rows of a 9-row sprite are the rider (vs the creature body).
const KNIGHT_ROWS = 3;

const COLS = 192;
const ROWS = 64;
const HUD_ROWS = 1;
const BOTTOM_ROW = ROWS - 1;

// Platforms are now LIVE-MEASURED from the page DOM (data-game-platform).
// `dynamicPlatforms` is updated by the usePlatforms hook each scroll/resize.
let dynamicPlatforms = [];
function setDynamicPlatforms(p) { dynamicPlatforms = p; }

// Lava rises from below over waves (covers entire viewport bottom).
function lavaTopRow(wave) {
  if (wave <= 2) return BOTTOM_ROW + 2; // off-screen, hidden
  const visible = wave - 2;
  return BOTTOM_ROW - visible + 1;
}

// Physics (cells per logic-step at 60Hz). Tuned against the NES ROM:
//   - Sustained-flap upward rate observed in jsnes attract mode: ~0.5 px/f
//     → ~0.10 cells/f (yscale = 48/240 = 0.2). With GRAVITY = 0.045 and
//     repeated FLAP_IMPULSE = -0.75 every ~14 frames, average rise ≈ 0.10/f.
//   - Horizontal max ≈ 1.5 NES px/f → ~0.95 cells/f (xscale = 0.625).
//   - Floor / platform Y values match nametable-extracted layout.
// Physics — scaled to the 192x64 grid so vertical/horizontal speeds *visually*
// match the previous 160x48 grid (cells per frame × cells per viewport unit).
// Slowed ~25% from prior tuning — game read as too frantic.
const GRAVITY = 0.045;
const MAX_FALL = 0.70;
const FLAP_IMPULSE = -0.78;
const ACCEL = 0.075;
const MAX_VX = 1.00;
const FRICTION_GROUND = 0.86;
const FRICTION_AIR = 0.995;
const RESPAWN_FRAMES = 90;
const RESPAWN_INVULN_FRAMES = 90;

// Egg lifecycle (frames @ 60Hz)
const EGG_HATCH_FRAMES   = 360;     // 6s on a platform before hatching
const EGG_POINTS         = 500;
const UNMOUNTED_REMOUNT_FRAMES = 240; // walking unmounted enemy will re-mount after this
const UNMOUNTED_POINTS   = 100;

// Pterodactyl
const PTERO_SPAWN_DELAY_BASE = 1500; // 25s of no kills
const PTERO_SPEED            = 1.0;  // cells/frame
const PTERO_KILL_POINTS      = 1000;
const PTERO_MOUTH_OPEN_FRAMES = 18;  // window of vulnerability
const PTERO_MOUTH_CYCLE       = 90;  // frames between mouth opens

// Lava troll
const TROLL_REACH_HEIGHT  = 6;       // cells the hand reaches above lava top
const TROLL_GRAB_X_RANGE  = 4;       // horizontal grab radius
const TROLL_RISE_INTERVAL = 240;     // frames between troll rises (4s)
const TROLL_RISE_FRAMES   = 60;      // hand stays risen for 1s

// Wave / score
const SCORE_PER_KILL = 750;
const EXTRA_LIFE_THRESHOLD = 20000;

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

// Knight = player or enemy mounted on a flying creature (same shape, palette swap).
// Enemy archetypes:
//   "bounder" — slow, dumb (most common, beige) — easiest to joust
//   "hunter"  — medium, more aggressive (red, currently the main enemy)
//   "shadow"  — fast, persistent (gray) — hardest
const ARCHETYPES = {
  bounder: { speed: 0.40, flapRate: 0.012, score: 500,  color: C_BOUNDER },
  hunter:  { speed: 0.55, flapRate: 0.020, score: 750,  color: C_HUNTER  },
  shadow:  { speed: 0.75, flapRate: 0.030, score: 1500, color: C_SHADOW  },
};

function makeEntity(x, y, isPlayer, facing, archetype) {
  const kind = "knight";
  const team = isPlayer ? "player" : "enemy";
  const arch = isPlayer ? null : (archetype || "hunter");
  return {
    kind, team, archetype: arch,
    x, y,
    vx: 0, vy: 0,
    facing: facing ?? 1,
    isPlayer: !!isPlayer, // legacy compat
    grounded: false,
    alive: true,
    deathFrames: 0,
    invulnFrames: isPlayer ? RESPAWN_INVULN_FRAMES : 0,
    flapAnimFrames: 0,
    h: PLAYER_H,
    w: SPRITE_W,
  };
}

function makeEgg(x, y) {
  return {
    kind: "egg", team: "neutral",
    x, y,
    vx: (Math.random() - 0.5) * 0.4,
    vy: -0.45,                        // small upward kick — egg "ejects" above the death puff
    grounded: false,
    alive: true, deathFrames: 0,
    hatchTimer: EGG_HATCH_FRAMES,
    h: 3, w: 4,
  };
}

function makeScorePopup(x, y, text, color) {
  return {
    kind: "popup", team: "neutral",
    x, y,
    vx: 0, vy: -0.25,
    text,
    color: color ?? C_ACCENT,
    lifetime: 50,
    alive: true, deathFrames: 0,
    h: 1, w: text.length,
  };
}

function makeUnmounted(x, y, facing, archetype) {
  return {
    kind: "unmounted", team: "enemy", archetype,
    x, y,
    vx: 0, vy: 0,
    facing: facing ?? 1,
    grounded: false,
    alive: true, deathFrames: 0,
    h: 6, w: 6,
    remountTimer: UNMOUNTED_REMOUNT_FRAMES,
  };
}

function makePtero(state) {
  // Spawn off-screen on the side opposite the player, fly toward them
  const player = state.entities[0];
  const fromLeft = !player || player.x > COLS / 2;
  const x = fromLeft ? -25 : COLS + 5;
  const y = 6 + Math.floor(Math.random() * 18);
  return {
    kind: "ptero", team: "enemy",
    x, y,
    vx: fromLeft ? PTERO_SPEED : -PTERO_SPEED,
    vy: 0,
    facing: fromLeft ? 1 : -1,
    alive: true, deathFrames: 0,
    h: 5, w: 24,
    mouthCycle: 0,            // counts up; mouth opens for PTERO_MOUTH_OPEN_FRAMES every PTERO_MOUTH_CYCLE
  };
}

function makeTroll(x) {
  return {
    kind: "troll", team: "enemy",
    x,
    state: "lurking",         // "lurking" | "rising" | "risen" | "retracting"
    timer: TROLL_RISE_INTERVAL,
    riseHeight: 0,            // 0..TROLL_REACH_HEIGHT
    h: 6, w: 5,
    alive: true, deathFrames: 0,
  };
}

// Frames between game start (or wave clear) and the first enemy spawning.
// Gives the player a beat to orient.
const FIRST_WAVE_DELAY = 180;     // ~3 seconds at 60Hz
const NEXT_WAVE_DELAY  = 90;      // ~1.5 seconds — between waves

function createGameState() {
  return {
    entities: [makeEntity(8, 4, true, 1)], // placeholder — start() repositions onto the marquee
    score: 0,
    lives: 3,
    wave: 1,
    pendingWave: FIRST_WAVE_DELAY,
    pendingRespawn: 0,
    gameOver: false,
    started: false,
    paused: false,
    ambient: true,
    keys: { left: false, right: false },
    flapQueued: 0,
    frame: 0,
    // Pterodactyl state — counts UP toward `delay`, then spawns and resets to 0
    pteroTimer: 0,
    // For extra-life thresholds
    nextExtraLifeAt: EXTRA_LIFE_THRESHOLD,
    // Tracks when wave 1 spawned (so we don't bump wave counter the first time)
    firstWaveSpawned: false,
  };
}

// Wave composition by wave number — borrowed from arcade Joust pacing.
// Returns an array of archetype names for that wave.
function waveComposition(wave) {
  // Cap total enemies at 5 so the screen doesn't get overwhelming
  const total = Math.min(2 + Math.floor(wave / 2), 5);
  const out = [];
  for (let i = 0; i < total; i++) {
    if (wave <= 2) {
      out.push("bounder");
    } else if (wave <= 5) {
      out.push(i === 0 ? "hunter" : "bounder");
    } else if (wave <= 9) {
      out.push(i < total - 1 ? "hunter" : "bounder");
    } else {
      const r = Math.random();
      out.push(r < 0.4 ? "shadow" : r < 0.85 ? "hunter" : "bounder");
    }
  }
  return out;
}

function spawnWave(state) {
  const composition = waveComposition(state.wave);
  for (let i = 0; i < composition.length; i++) {
    const x = ((i + 1) * COLS) / (composition.length + 1);
    const y = 3 + (i % 2) * 2;
    const facing = i % 2 === 0 ? -1 : 1;
    state.entities.push(makeEntity(x, y, false, facing, composition[i]));
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
  // Highest platform top at-or-below `fromY` in column x. Reads live-measured
  // page DOM platforms (`dynamicPlatforms`), skipping ones covered by lava.
  const cx = Math.floor(x);
  const lavaTop = lavaTopRow(wave);
  let best = null;
  for (const p of dynamicPlatforms) {
    if (p.y >= lavaTop) continue; // submerged
    if (cx >= p.x && cx < p.x + p.w && p.y >= fromY - 0.001) {
      if (best === null || p.y < best) best = p.y;
    }
  }
  return best;
}

function inLava(x, y, wave) {
  // Fell off the bottom of the visible world — always lethal regardless of wave
  if (y > BOTTOM_ROW + 3) return true;
  return y >= lavaTopRow(wave);
}

// Live-platform measurement: scans DOM for [data-game-platform] elements
// and converts their bounding rects to game-grid coordinates. Throttled to
// requestAnimationFrame on scroll/resize so we don't burn the main thread.
function usePlatformsFromDOM() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    let rafId = null;
    function measure() {
      rafId = null;
      const els = document.querySelectorAll("[data-game-platform]");
      const cellW = window.innerWidth / COLS;
      const cellH = window.innerHeight / ROWS;
      const out = [];
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue; // off-screen
        if (r.width <= 0 || r.height <= 0) continue;
        const x = r.left / cellW;
        const y = r.top / cellH;
        const w = r.width / cellW;
        out.push({ x, y, w });
      }
      setDynamicPlatforms(out);
    }
    function schedule() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(measure);
    }
    measure();
    // Re-measure on scroll + resize. NO MutationObserver — the game's own
    // innerHTML mutations would trigger it and create a feedback loop.
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Slow tick to catch CSS-animated platforms (the marquee scrolls via
    // transform, which doesn't fire scroll/resize events).
    const interval = setInterval(schedule, 200);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      clearInterval(interval);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);
}

function updateEntity(e, state) {
  if (!e.alive) {
    e.deathFrames++;
    return;
  }
  switch (e.kind) {
    case "knight":     updateKnight(e, state); break;
    case "egg":        updateEgg(e, state); break;
    case "unmounted":  updateUnmounted(e, state); break;
    case "ptero":      updatePtero(e, state); break;
    case "troll":      updateTroll(e, state); break;
    case "popup":      updatePopup(e, state); break;
  }
}

function updatePopup(e /*, state */) {
  e.y += e.vy;
  e.vy *= 0.94; // ease the rise
  e.lifetime--;
  if (e.lifetime <= 0) {
    e.alive = false;
    e.deathFrames = -1; // suppress death-puff
  }
}

function updateKnight(e, state) {
  if (e.invulnFrames > 0) e.invulnFrames--;
  if (e.flapAnimFrames > 0) e.flapAnimFrames--;

  // ---- Input / AI ----
  let xInput = false;
  if (e.team === "player") {
    if (state.keys.left)  { e.vx -= ACCEL; e.facing = -1; xInput = true; }
    if (state.keys.right) { e.vx += ACCEL; e.facing = 1; xInput = true; }
    while (state.flapQueued > 0) {
      e.vy = FLAP_IMPULSE;
      e.grounded = false;
      e.flapAnimFrames = 10;
      state.flapQueued--;
    }
  } else {
    const arch = ARCHETYPES[e.archetype] || ARCHETYPES.hunter;
    const player = state.entities[0];
    if (player && player.alive) {
      const dx = dxWrap(player.x, e.x);
      if (dx > 0.5) { e.vx += ACCEL * arch.speed; e.facing = 1; xInput = true; }
      else if (dx < -0.5) { e.vx -= ACCEL * arch.speed; e.facing = -1; xInput = true; }
      const cap = MAX_VX * (0.45 + arch.speed * 0.4); // bounder ~0.61, hunter ~0.67, shadow ~0.75
      if (e.vx >  cap) e.vx =  cap;
      if (e.vx < -cap) e.vx = -cap;

      if (e.grounded) {
        if (Math.random() < arch.flapRate * 1.5) {
          e.vy = FLAP_IMPULSE * 0.85;
          e.grounded = false;
          e.flapAnimFrames = 10;
        }
      } else {
        const wantHigher = e.y > player.y - 1.5;
        if (wantHigher && Math.random() < arch.flapRate) {
          e.vy = FLAP_IMPULSE * 0.7;
          e.flapAnimFrames = 10;
        } else if (Math.random() < arch.flapRate * 0.25) {
          e.vy = FLAP_IMPULSE * 0.55;
          e.flapAnimFrames = 10;
        }
      }
    }
  }
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

// Egg falls under gravity, rests on platforms. Hatch timer ticks down only
// while grounded. Touching lava destroys the egg silently.
function updateEgg(e, state) {
  e.vy += GRAVITY;
  if (e.vy > MAX_FALL) e.vy = MAX_FALL;
  // Mild air drag on horizontal drift; stops quickly on landing
  e.vx *= e.grounded ? 0.6 : 0.99;
  const prevY = e.y;
  e.x = wrapX(e.x + e.vx);
  e.y += e.vy;
  // Platform landing
  const footX = e.x + e.w / 2;
  const platY = platformAt(footX, prevY + e.h, state.wave);
  if (platY !== null && e.vy >= 0 && (e.y + e.h) >= platY) {
    e.y = platY - e.h;
    e.vy = 0;
    e.grounded = true;
  } else {
    e.grounded = false;
  }
  if (e.grounded && e.hatchTimer > 0) {
    e.hatchTimer--;
    if (e.hatchTimer === 0) {
      // Hatch — replace egg with an unmounted enemy
      e.alive = false;
      e.deathFrames = -1; // suppress death-puff visuals
      const archetype = pickHatchedArchetype(state.wave);
      state.entities.push(makeUnmounted(e.x - 1, e.y - 1, Math.random() < 0.5 ? -1 : 1, archetype));
    }
  }
  // Lava death
  if (inLava(e.x + e.w / 2, e.y + e.h, state.wave)) {
    e.alive = false;
    e.deathFrames = 0;
  }
}

function pickHatchedArchetype(wave) {
  if (wave <= 3) return "bounder";
  if (wave <= 7) return Math.random() < 0.5 ? "hunter" : "bounder";
  return Math.random() < 0.4 ? "shadow" : "hunter";
}

// Unmounted enemy walks left/right on the platform. After a delay, "remounts"
// (becomes a knight again — flies off looking for the player).
function updateUnmounted(e, state) {
  e.vy += GRAVITY;
  if (e.vy > MAX_FALL) e.vy = MAX_FALL;
  const prevY = e.y;
  // Walk in current facing direction at modest speed
  e.vx = e.facing * 0.3;
  e.x = wrapX(e.x + e.vx);
  e.y += e.vy;
  // Platform landing
  const footX = e.x + e.w / 2;
  const platY = platformAt(footX, prevY + e.h, state.wave);
  if (platY !== null && e.vy >= 0 && (e.y + e.h) >= platY) {
    e.y = platY - e.h;
    e.vy = 0;
    e.grounded = true;
  } else {
    e.grounded = false;
  }
  // Walked off platform edge → fall a bit then turn around when grounded again
  if (e.grounded) {
    // If we're at the edge of our platform, flip
    const lookahead = footX + e.facing * 2;
    const aheadPlat = platformAt(lookahead, e.y + e.h - 0.5, state.wave);
    if (aheadPlat === null || Math.abs(aheadPlat - (e.y + e.h)) > 0.5) {
      e.facing = -e.facing;
    }
    e.remountTimer--;
    if (e.remountTimer <= 0) {
      e.alive = false;
      e.deathFrames = -1;
      // Remount — spawn a fresh knight (this is the egg's full lifecycle:
      // egg → unmounted → re-mounted enemy)
      state.entities.push(makeEntity(e.x, e.y - 4, false, e.facing, e.archetype));
    }
  }
  // Lava death
  if (inLava(e.x + e.w / 2, e.y + e.h, state.wave)) {
    e.alive = false;
    e.deathFrames = 0;
  }
}

// Pterodactyl flies horizontally at high speed, wraps. Mouth opens periodically
// — if a player's lance hits the open mouth, the ptero dies. Otherwise the
// player dies on contact.
function updatePtero(e, state) {
  // Despawn after exiting the screen on the side it was heading toward
  e.mouthCycle = (e.mouthCycle + 1) % PTERO_MOUTH_CYCLE;
  e.x += e.vx;
  // Slight vertical wobble
  e.vy = Math.sin(e.mouthCycle * 0.07) * 0.15;
  e.y += e.vy;
  // Wrap or despawn? In real Joust the ptero keeps coming back. We'll wrap.
  if (e.x < -30) e.x = COLS + 5;
  if (e.x > COLS + 30) e.x = -25;
}

function pteroMouthOpen(e) {
  return e.mouthCycle < PTERO_MOUTH_OPEN_FRAMES;
}

// Lava troll: stationary at a fixed x, periodically rises a "hand" up out
// of the lava. While risen, anyone within reach gets grabbed and pulled down.
function updateTroll(e, state) {
  e.timer--;
  if (e.timer <= 0) {
    if (e.state === "lurking") {
      e.state = "rising";
      e.riseHeight = 0;
      e.timer = TROLL_RISE_FRAMES;
    } else if (e.state === "rising" || e.state === "risen") {
      e.state = "retracting";
      e.timer = TROLL_RISE_FRAMES;
    } else {
      e.state = "lurking";
      e.timer = TROLL_RISE_INTERVAL;
      e.riseHeight = 0;
    }
  }
  // Smoothly rise / retract
  if (e.state === "rising") {
    e.riseHeight = Math.min(TROLL_REACH_HEIGHT, e.riseHeight + 0.25);
    if (e.riseHeight >= TROLL_REACH_HEIGHT) e.state = "risen";
  } else if (e.state === "retracting") {
    e.riseHeight = Math.max(0, e.riseHeight - 0.2);
  }
  // Grab any character within reach while risen
  if (e.state === "risen" || (e.state === "rising" && e.riseHeight > 2)) {
    const lavaTop = lavaTopRow(state.wave);
    const handTopY = lavaTop - e.riseHeight;
    for (const other of state.entities) {
      if (other === e || !other.alive) continue;
      if (other.kind !== "knight") continue;
      if (state.ambient && other.team === "player") continue;
      if (other.invulnFrames > 0) continue;
      const dx = Math.abs(dxWrap(other.x + other.w / 2, e.x));
      if (dx < TROLL_GRAB_X_RANGE && other.y + other.h >= handTopY) {
        // Grabbed — pull into lava
        other.vy = MAX_FALL;
        other.vx = 0;
        // Force death next physics step via lava check
        if (other.team === "player") {
          state.lives--;
          if (state.lives <= 0) state.gameOver = true;
          else state.pendingRespawn = RESPAWN_FRAMES;
        } else {
          state.score += SCORE_PER_KILL;
          checkExtraLife(state);
          state.entities.push(makeScorePopup(other.x, other.y - 1, "+" + SCORE_PER_KILL, C_TROLL));
        }
        other.alive = false;
        other.deathFrames = 0;
      }
    }
  }
}

function resolveJousts(state) {
  const ents = state.entities;
  for (let i = 0; i < ents.length; i++) {
    const a = ents[i];
    if (!a.alive) continue;
    for (let j = i + 1; j < ents.length; j++) {
      const b = ents[j];
      if (!b.alive) continue;
      handleCollision(state, a, b);
    }
  }
}

function entitiesOverlap(a, b) {
  const dx = Math.abs(dxWrap(a.x + a.w / 2, b.x + b.w / 2));
  const dy = Math.abs((a.y + a.h / 2) - (b.y + b.h / 2));
  return dx < (a.w + b.w) / 2.5 && dy < (a.h + b.h) / 2.5;
}

function handleCollision(state, a, b) {
  // Ambient mode protection — player is invulnerable to all damage
  const involvesPlayer = a.team === "player" || b.team === "player";
  if (state.ambient && involvesPlayer) return;
  // Respawn invuln
  if ((a.invulnFrames || 0) > 0 || (b.invulnFrames || 0) > 0) return;

  if (!entitiesOverlap(a, b)) return;

  // ---- Knight vs Knight: classic joust ----
  if (a.kind === "knight" && b.kind === "knight") {
    const diff = a.y - b.y;
    if (Math.abs(diff) < 0.45) {
      // Bounce — swap and damp
      const tmp = a.vx;
      a.vx = b.vx * 0.7;
      b.vx = tmp * 0.7;
      if (dxWrap(a.x, b.x) > 0) { a.x = wrapX(a.x + 0.6); b.x = wrapX(b.x - 0.6); }
      else                       { a.x = wrapX(a.x - 0.6); b.x = wrapX(b.x + 0.6); }
    } else if (diff < 0) {
      knightKilledBy(state, a, b);
    } else {
      knightKilledBy(state, b, a);
    }
    return;
  }

  // ---- Knight vs Egg: collect (player) or break (enemy) ----
  if ((a.kind === "knight" && b.kind === "egg") ||
      (a.kind === "egg" && b.kind === "knight")) {
    const knight = a.kind === "knight" ? a : b;
    const egg = a.kind === "egg" ? a : b;
    egg.alive = false;
    egg.deathFrames = -1;
    if (knight.team === "player") {
      state.score += EGG_POINTS;
      checkExtraLife(state);
      state.entities.push(makeScorePopup(egg.x - 1, egg.y - 1, "+" + EGG_POINTS, C_EGG));
    }
    return;
  }

  // ---- Knight vs Unmounted: kill the unmounted (player) or nothing (enemy) ----
  if ((a.kind === "knight" && b.kind === "unmounted") ||
      (a.kind === "unmounted" && b.kind === "knight")) {
    const knight = a.kind === "knight" ? a : b;
    const unmounted = a.kind === "unmounted" ? a : b;
    if (knight.team === "player") {
      unmounted.alive = false;
      unmounted.deathFrames = 0;
      state.score += UNMOUNTED_POINTS;
      checkExtraLife(state);
      state.entities.push(makeScorePopup(unmounted.x, unmounted.y - 1, "+" + UNMOUNTED_POINTS, C_BOUNDER));
    }
    return;
  }

  // ---- Knight vs Pterodactyl ----
  if ((a.kind === "knight" && b.kind === "ptero") ||
      (a.kind === "ptero" && b.kind === "knight")) {
    const knight = a.kind === "knight" ? a : b;
    const ptero = a.kind === "ptero" ? a : b;
    // Mouth-hit kill: player must be facing into the ptero AND the mouth open
    // AND aligned vertically with the mouth (front 25% of ptero on the facing side)
    const mouthOpen = pteroMouthOpen(ptero);
    const knightLanceX = knight.x + (knight.facing === 1 ? knight.w : 0);
    const pteroMouthX = ptero.facing === 1 ? ptero.x + ptero.w : ptero.x;
    const lanceVsMouthDx = Math.abs(dxWrap(knightLanceX, pteroMouthX));
    const facingMouth = knight.facing !== ptero.facing; // facing into the ptero
    if (knight.team === "player" && mouthOpen && facingMouth && lanceVsMouthDx < 4) {
      ptero.alive = false;
      ptero.deathFrames = 0;
      state.score += PTERO_KILL_POINTS;
      checkExtraLife(state);
      state.entities.push(makeScorePopup(ptero.x + ptero.w / 2 - 3, ptero.y - 1, "+" + PTERO_KILL_POINTS, C_PTERO_HI));
    } else if (knight.team === "player") {
      // Touch death
      knight.alive = false;
      knight.deathFrames = 0;
      state.lives--;
      if (state.lives <= 0) state.gameOver = true;
      else state.pendingRespawn = RESPAWN_FRAMES;
    } else {
      // Ptero touching enemy knight: kills enemy too (chaos!)
      knight.alive = false;
      knight.deathFrames = 0;
    }
    return;
  }
}

function knightKilledBy(state, winner, loser) {
  if (loser.team === "player") {
    loser.alive = false;
    loser.deathFrames = 0;
    state.lives--;
    if (state.lives <= 0) state.gameOver = true;
    else state.pendingRespawn = RESPAWN_FRAMES;
  } else {
    // Enemy killed → spawn an egg at the kill location
    loser.alive = false;
    loser.deathFrames = 0;
    state.entities.push(makeEgg(loser.x + loser.w / 2 - 2, loser.y + 1));
    const arch = ARCHETYPES[loser.archetype] || ARCHETYPES.hunter;
    state.score += arch.score;
    checkExtraLife(state);
    // Floating "+750" near where the enemy died
    state.entities.push(makeScorePopup(loser.x, loser.y - 1, "+" + arch.score, arch.color));
  }
}

function checkExtraLife(state) {
  if (state.score >= state.nextExtraLifeAt) {
    state.lives++;
    state.nextExtraLifeAt += EXTRA_LIFE_THRESHOLD;
  }
}

function isThreat(e) {
  // What counts as "still in this wave" — enemy knights, eggs (will hatch),
  // unmounted enemies (will remount). Pterodactyl + troll are independent.
  return e.alive && (
    (e.kind === "knight" && e.team === "enemy") ||
    e.kind === "egg" ||
    e.kind === "unmounted"
  );
}

function maybeAdvanceWave(state) {
  const threats = state.entities.some(isThreat);
  if (threats) return;
  if (state.pendingWave === 0) {
    state.pendingWave = NEXT_WAVE_DELAY;
  } else {
    state.pendingWave--;
    if (state.pendingWave === 0) {
      // Sweep dead entities + reset ptero timer so the next wave is fresh
      state.entities = state.entities.filter((e) => e.team === "player" || e.alive || e.kind === "troll");
      state.pteroTimer = 0;
      if (state.wave === 1 && !state.firstWaveSpawned) {
        state.firstWaveSpawned = true;
      } else {
        state.wave++;
      }
      spawnWave(state);
    }
  }
}

// Spawn one pterodactyl after `pteroTimer` expires, IF there's no ptero on
// screen yet and there are still enemy knights/eggs (else just give the
// player room to breathe between waves).
function maybePterodactyl(state) {
  const hasPtero = state.entities.some((e) => e.kind === "ptero" && e.alive);
  if (hasPtero) return;
  const threats = state.entities.some(isThreat);
  if (!threats) {
    // Reset timer between waves so the inter-wave breather doesn't get
    // immediately consumed by a ptero on the next wave's first frame.
    state.pteroTimer = 0;
    return;
  }
  // Late-wave spawns are quicker. Wave 1: 25s, wave 5: 23s, wave 15: 10s.
  const delay = Math.max(600, PTERO_SPAWN_DELAY_BASE - state.wave * 60);
  state.pteroTimer++;
  if (state.pteroTimer >= delay) {
    state.entities.push(makePtero(state));
    state.pteroTimer = 0;
  }
}

// Place trolls in the lava strip when lava becomes visible. One troll for
// now — could be expanded to multiple.
function maybeSpawnTrolls(state) {
  const haveTroll = state.entities.some((e) => e.kind === "troll");
  if (haveTroll) return;
  if (lavaTopRow(state.wave) > BOTTOM_ROW) return; // lava not visible yet
  state.entities.push(makeTroll(Math.floor(COLS / 2)));
}

// Find the widest DOM-derived platform — that's the marquee. Used as the
// player spawn pad so they appear standing on the page's most prominent
// horizontal element, like the floor in arcade Joust.
function findSpawnPlatform() {
  let best = null;
  for (const p of dynamicPlatforms) {
    if (p.w > COLS * 0.5 && (!best || p.w > best.w)) best = p;
  }
  return best;
}

function placePlayerOnSpawnPlatform(player) {
  const spawn = findSpawnPlatform();
  if (!spawn) return false;
  player.x = spawn.x + spawn.w / 2 - player.w / 2;
  player.y = spawn.y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.facing = 1;
  player.grounded = true;
  player.invulnFrames = 90;
  return true;
}

function maybeRespawnPlayer(state) {
  const player = state.entities[0];
  if (!player) return;
  if (!player.alive && !state.gameOver) {
    if (state.pendingRespawn > 0) {
      state.pendingRespawn--;
      if (state.pendingRespawn === 0) {
        player.alive = true;
        if (!placePlayerOnSpawnPlatform(player)) {
          // Fallback if no spawn platform available (page DOM not yet measured)
          player.x = 8;
          player.y = 4;
          player.vx = 0;
          player.vy = 0;
          player.facing = 1;
          player.invulnFrames = RESPAWN_INVULN_FRAMES;
        }
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
      colors[gy][x] = (y === lavaTop || t >= 9) ? C_LAVA_HI : C_LAVA;
    }
  }

  // No platform drawing — the page IS the world. Each [data-game-platform]
  // element shows through the transparent overlay; sprites land on top.

  // Entities
  for (const e of state.entities) {
    if (!e.alive) {
      // deathFrames === -1 → suppress death-puff (used for eggs hatching, etc.)
      if (e.deathFrames >= 0 && e.deathFrames < 24) {
        const cx = Math.round(e.x);
        const cy = Math.round(e.y) + yOff;
        const puff = e.deathFrames < 12 ? "*" : ".";
        const ph = e.h || 4;
        const pw = e.w || 6;
        for (let dy = 0; dy < ph; dy++) {
          for (let dx = 0; dx < pw; dx++) {
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
    if ((e.invulnFrames || 0) > 0 && Math.floor(e.invulnFrames / 4) % 2 === 0) continue;
    if (e.kind === "troll") e._lavaTopY = lavaTop; // pass lava reference for clipped render
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
  switch (e.kind) {
    case "knight":    drawKnight(grid, colors, e, yOff, frame); break;
    case "egg":       drawEgg(grid, colors, e, yOff, frame); break;
    case "unmounted": drawUnmounted(grid, colors, e, yOff, frame); break;
    case "ptero":     drawPtero(grid, colors, e, yOff, frame); break;
    case "troll":     drawTroll(grid, colors, e, yOff, frame); break;
    case "popup":     drawPopup(grid, colors, e, yOff, frame); break;
  }
}

function drawPopup(grid, colors, e, yOff /*, frame */) {
  const cx = Math.round(e.x);
  const cy = Math.round(e.y) + yOff;
  if (cy < 0 || cy >= grid.length) return;
  for (let i = 0; i < e.text.length; i++) {
    const gx = wrapX(cx + i);
    grid[cy][gx] = e.text[i];
    colors[cy][gx] = e.color;
  }
}

function placeSprite(grid, colors, sprite, cx, cy, defaultColor, knightRows = 0) {
  for (let r = 0; r < sprite.length; r++) {
    const row = sprite[r];
    const gy = cy + r;
    if (gy < 0 || gy >= grid.length) continue;
    const rowColor = r < knightRows ? C_KNIGHT : defaultColor;
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === " ") continue;
      const gx = wrapX(cx + c);
      grid[gy][gx] = ch;
      colors[gy][gx] = rowColor;
    }
  }
}

function drawKnight(grid, colors, e, yOff, frame) {
  const cx = Math.round(e.x);
  let cy = Math.round(e.y) + yOff;
  const dir = e.facing === 1 ? "_right" : "_left";
  let name;
  if (e.grounded) {
    const moving = Math.abs(e.vx) > 0.05;
    name = moving && Math.floor(frame / 6) % 2 === 0 ? "player_stand_b" : "player_stand_a";
  } else {
    if (e.vy < -0.1) {
      cy -= 2;
      name = Math.floor(frame / 3) % 2 === 0 ? "player_fly" : "player_fly_b";
    } else {
      name = "player_fly";
    }
  }
  const sprite = SPRITE_GRIDS[name + dir];
  if (!sprite) return;
  // Body color depends on team + (for enemies) archetype
  let bodyColor;
  if (e.team === "player") bodyColor = C_PLAYER;
  else if (e.archetype && ARCHETYPES[e.archetype]) bodyColor = ARCHETYPES[e.archetype].color;
  else bodyColor = C_ENEMY;
  placeSprite(grid, colors, sprite, cx, cy, bodyColor, KNIGHT_ROWS);
}

function drawEgg(grid, colors, e, yOff /*, frame */) {
  const cx = Math.round(e.x);
  const cy = Math.round(e.y) + yOff;
  // Choose visual based on hatchTimer progress
  const t = e.hatchTimer;
  const name = t > 200 ? "egg" : t > 80 ? "egg_cracked" : "egg_hatching";
  const sprite = SPRITE_GRIDS[name];
  if (!sprite) return;
  placeSprite(grid, colors, sprite, cx, cy, C_EGG);
}

function drawUnmounted(grid, colors, e, yOff /*, frame */) {
  const cx = Math.round(e.x);
  const cy = Math.round(e.y) + yOff;
  const dir = e.facing === 1 ? "_right" : "_left";
  const sprite = SPRITE_GRIDS["unmounted" + dir];
  if (!sprite) return;
  const color = e.archetype && ARCHETYPES[e.archetype] ? ARCHETYPES[e.archetype].color : C_ENEMY;
  placeSprite(grid, colors, sprite, cx, cy, color, 2); // top 2 rows = head/helmet (knight color)
}

function drawPtero(grid, colors, e, yOff, frame) {
  const cx = Math.round(e.x);
  const cy = Math.round(e.y) + yOff;
  const dir = e.facing === 1 ? "_right" : "_left";
  const open = pteroMouthOpen(e);
  const name = (open ? "pterodactyl_open" : "pterodactyl") + dir;
  const sprite = SPRITE_GRIDS[name];
  if (!sprite) return;
  // Use C_PTERO_HI when mouth is open (warning glow), else C_PTERO
  placeSprite(grid, colors, sprite, cx, cy, open ? C_PTERO_HI : C_PTERO);
}

function drawTroll(grid, colors, e, yOff, frame) {
  if (e.riseHeight <= 0) return; // hidden in lava
  const lavaTop = lavaTopRow(e._waveCache || 1); // not great, but troll renders below
  // We don't have direct access to state.wave here; cy is computed from
  // current lavaTop via the renderFrame caller. Fallback approach:
  const cx = Math.round(e.x) - 2;
  // Render the hand sprite from (lavaTop - riseHeight) up to lavaTop
  const sprite = SPRITE_GRIDS.troll_hand;
  if (!sprite) return;
  // Sprite is 6 rows tall; we want the BOTTOM of the sprite to be at lavaTop
  // and the visible portion to be `riseHeight` rows. Crop visually:
  const visible = Math.ceil(e.riseHeight);
  const startRow = sprite.length - visible;
  const cy = (e._lavaTopY ?? BOTTOM_ROW) - visible + yOff;
  for (let r = startRow; r < sprite.length; r++) {
    const row = sprite[r];
    const gy = cy + (r - startRow);
    if (gy < 0 || gy >= grid.length) continue;
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === " ") continue;
      const gx = wrapX(cx + c);
      grid[gy][gx] = ch;
      colors[gy][gx] = C_TROLL;
    }
  }
}

export default function AsciiJoust({ startActive = false }) {
  const preRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const [hudTick, setHudTick] = useState(0); // forces re-render of overlay UI
  const [focused, setFocused] = useState(false);

  // Initialize state once
  if (stateRef.current === null) {
    stateRef.current = createGameState();
    if (startActive) stateRef.current.ambient = false;
  }

  const start = useCallback(() => {
    const s = stateRef.current;
    Object.assign(s, createGameState());
    s.started = true;
    if (startActive) s.ambient = false; // marquee-triggered: skip ambient demo
    setHudTick((n) => n + 1);
    // Defer spawn placement to next frame so usePlatformsFromDOM has
    // populated dynamicPlatforms first. (Hooks may run before our measure.)
    requestAnimationFrame(() => {
      placePlayerOnSpawnPlatform(s.entities[0]);
    });
  }, [startActive]);

  // Live-measure platforms from the page DOM (every [data-game-platform]).
  // Declared BEFORE auto-start so the platforms hook's useEffect runs first
  // and dynamicPlatforms is populated before start() positions the player.
  usePlatformsFromDOM();

  // Auto-start the game on mount.
  useEffect(() => {
    if (!stateRef.current.started) start();
    if (startActive && preRef.current) {
      preRef.current.focus();
    }
  }, [start, startActive]);

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
          maybePterodactyl(s);
          maybeSpawnTrolls(s);
          // Cull dead entities periodically (eggs hatch, ptero exits, etc.)
          if (s.frame % 30 === 0) {
            s.entities = s.entities.filter(
              (e) => e.team === "player" || e.alive || (e.deathFrames >= 0 && e.deathFrames < 24)
            );
          }
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
    <div className="joust-game-wrap fixed inset-0 z-30 pointer-events-none select-none overflow-hidden">
      <pre
        ref={preRef}
        tabIndex={0}
        onFocus={() => {
          setFocused(true);
          const s = stateRef.current;
          if (s) {
            s.ambient = false;
            if (!s.started || s.gameOver) start();
          }
        }}
        onBlur={() => setFocused(false)}
        onClick={() => preRef.current?.focus()}
        className={`joust-game-screen pointer-events-auto m-0 leading-none whitespace-pre outline-none transition-opacity duration-300 ${
          focused ? "opacity-100" : "opacity-70"
        }`}
        aria-label="ASCII Joust over the page — click to play"
        role="application"
      />
    </div>
  );
}
