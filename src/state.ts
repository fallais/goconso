import { OFFERS, TEMPO_COLORS, type HcHp, type OfferId, type TempoColor } from "./edf/offers";
import { CATALOG, KINDS, type Kind, type Timing } from "./equipment/catalog";
import type { Equipment } from "./equipment/estimate";
import type { Profile } from "./simulation";

export interface Readings {
  total: number;
  hc: number;
  hp: number;
  tempo: Record<TempoColor, HcHp>;
}

export interface State {
  offer: OfferId; // current option
  power: number; // kVA
  readings: Readings; // kWh over 12 months
  hcShare: number; // assumption used when the meter has no off-peak register
  tempoShares: { white: number; red: number }; // assumption used when not on Tempo
  equipments: Equipment[];
}

// Tempo has 22 red and 43 white days per year.
export const DEFAULT_TEMPO_SHARES = { white: 43 / 365, red: 22 / 365 };

export const defaultState = (): State => ({
  offer: "hphc",
  power: 9,
  readings: {
    total: 4700,
    hc: 1900,
    hp: 2800,
    tempo: { blue: { hc: 1500, hp: 2250 }, white: { hc: 230, hp: 370 }, red: { hc: 120, hp: 230 } },
  },
  hcShare: 0.35,
  tempoShares: { ...DEFAULT_TEMPO_SHARES },
  equipments: [],
});

export function profileFrom(state: State): Profile {
  const { readings, offer } = state;
  const assumedColors = {
    white: state.tempoShares.white,
    red: state.tempoShares.red,
    blue: 1 - state.tempoShares.white - state.tempoShares.red,
  };

  if (offer === "tempo") {
    const t = readings.tempo;
    const sum = (c: TempoColor) => t[c].hc + t[c].hp;
    const total = TEMPO_COLORS.reduce((s, c) => s + sum(c), 0);
    const hc = TEMPO_COLORS.reduce((s, c) => s + t[c].hc, 0);
    return {
      total,
      hcShare: total ? hc / total : state.hcShare,
      colorShares: total ? { blue: sum("blue") / total, white: sum("white") / total, red: sum("red") / total } : assumedColors,
      tempo: t,
    };
  }

  if (offer === "hphc") {
    const total = readings.hc + readings.hp;
    return { total, hcShare: total ? readings.hc / total : state.hcShare, colorShares: assumedColors };
  }

  return { total: readings.total, hcShare: state.hcShare, colorShares: assumedColors };
}

// ---------------------------------------------------------------------------
// Validation of untrusted input (shared links, local storage)
// ---------------------------------------------------------------------------

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

function number(v: unknown, fallback: number, min = 0, max = 1e7): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
}

function hcHp(v: unknown, fallback: HcHp): HcHp {
  const o = isObject(v) ? v : {};
  return { hc: number(o.hc, fallback.hc), hp: number(o.hp, fallback.hp) };
}

const TIMINGS: Timing[] = ["day", "night", "spread"];

function equipment(v: unknown): Equipment | null {
  if (!isObject(v) || !KINDS.includes(v.kind as Kind)) return null;
  const kind = v.kind as Kind;
  const base = CATALOG[kind];
  return {
    id: typeof v.id === "string" ? v.id.slice(0, 40) : newId(),
    kind,
    name: typeof v.name === "string" ? v.name.slice(0, 60) : base.label,
    power: number(v.power, base.power, 0, 50_000),
    hours: number(v.hours, base.hours, 0, 24),
    timing: TIMINGS.includes(v.timing as Timing) ? (v.timing as Timing) : base.timing,
  };
}

export function sanitizeState(raw: unknown): State {
  const d = defaultState();
  if (!isObject(raw)) return d;

  const r = isObject(raw.readings) ? raw.readings : {};
  const t = isObject(r.tempo) ? r.tempo : {};
  const ts = isObject(raw.tempoShares) ? raw.tempoShares : {};
  const white = number(ts.white, d.tempoShares.white, 0, 1);

  return {
    offer: OFFERS.includes(raw.offer as OfferId) ? (raw.offer as OfferId) : d.offer,
    power: number(raw.power, d.power, 1, 36),
    readings: {
      total: number(r.total, d.readings.total),
      hc: number(r.hc, d.readings.hc),
      hp: number(r.hp, d.readings.hp),
      tempo: {
        blue: hcHp(t.blue, d.readings.tempo.blue),
        white: hcHp(t.white, d.readings.tempo.white),
        red: hcHp(t.red, d.readings.tempo.red),
      },
    },
    hcShare: number(raw.hcShare, d.hcShare, 0, 1),
    tempoShares: { white, red: number(ts.red, d.tempoShares.red, 0, 1 - white) },
    equipments: Array.isArray(raw.equipments)
      ? raw.equipments.slice(0, 200).map(equipment).filter((e): e is Equipment => e !== null)
      : [],
  };
}

export const newId = () => Math.random().toString(36).slice(2, 10);

// ---------------------------------------------------------------------------
// Sharing and persistence
// ---------------------------------------------------------------------------

const SHARE_PREFIX = "#s=";
const STORAGE_KEY = "goconso:v2";

export function encodeShare(state: State): string {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64 = btoa(binary);
  return SHARE_PREFIX + b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShare(hash: string): State | null {
  if (!hash.startsWith(SHARE_PREFIX)) return null;
  try {
    const b64 = hash.slice(SHARE_PREFIX.length).replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return sanitizeState(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export function loadState(): State {
  const shared = decodeShare(location.hash);
  if (shared) {
    history.replaceState(null, "", location.pathname + location.search);
    return shared;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return sanitizeState(JSON.parse(saved));
  } catch {
    // Unreadable storage: start fresh.
  }
  return defaultState();
}

export function saveState(state: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or disabled: the app still works without persistence.
  }
}
