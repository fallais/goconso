import { parse } from "yaml";
import type { State } from "./state";

const OPTIONS = { base: "base", heures_creuses: "hphc", tempo: "tempo" } as const;

// Parses a `ma_conso.yml` file into the contract part of the state.
export function parseConfig(text: string, current: State): State {
  const raw = parse(text) ?? {};
  const offer = OPTIONS[raw.option as keyof typeof OPTIONS];
  if (!offer) throw new Error(`Option inconnue : ${raw.option} (attendu : base, heures_creuses ou tempo)`);

  const power = Number(raw.puissance);
  if (!Number.isInteger(power) || power <= 0) throw new Error(`Puissance invalide : ${raw.puissance}`);

  const index = raw.index ?? {};
  const read = (key: string, fallback: number) => {
    if (index[key] === undefined) return fallback;
    const n = Number(index[key]);
    if (!Number.isFinite(n) || n < 0) throw new Error(`Index invalide pour ${key} : ${index[key]}`);
    return n;
  };

  const r = current.readings;
  return {
    ...current,
    offer,
    power,
    readings: {
      total: read("total", r.total),
      hc: read("heures_creuses", r.hc),
      hp: read("heures_pleines", r.hp),
      tempo: {
        blue: { hc: read("bleu_hc", r.tempo.blue.hc), hp: read("bleu_hp", r.tempo.blue.hp) },
        white: { hc: read("blanc_hc", r.tempo.white.hc), hp: read("blanc_hp", r.tempo.white.hp) },
        red: { hc: read("rouge_hc", r.tempo.red.hc), hp: read("rouge_hp", r.tempo.red.hp) },
      },
    },
  };
}
