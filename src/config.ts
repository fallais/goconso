import { parse } from "yaml";
import type { ConsumptionInput } from "./analyzer";

// Parses the legacy `ma_conso.yml` format.
export function parseConfig(text: string): ConsumptionInput {
  const raw = parse(text) ?? {};
  const option = raw.option;
  if (option !== "base" && option !== "heures_creuses") {
    throw new Error(`Option inconnue : ${option} (attendu : base ou heures_creuses)`);
  }

  const power = Number(raw.puissance);
  if (!Number.isInteger(power)) throw new Error(`Puissance invalide : ${raw.puissance}`);

  const index = raw.index ?? {};
  const num = (v: unknown) => (v === undefined ? undefined : Number(v));
  return {
    option,
    power,
    index: {
      total: num(index.total),
      heures_creuses: num(index.heures_creuses),
      heures_pleines: num(index.heures_pleines),
    },
  };
}
