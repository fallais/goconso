import { BASE_TARIFFS_CSV } from "./baseTariffs";
import { OFFPEAK_TARIFFS_CSV } from "./offpeakTariffs";
import { TEMPO_TARIFFS_CSV } from "./tempoTariffs";
import { availablePowers, findActiveRow, parseFrenchNumber as num, parseTariffCsv, type TariffRow } from "./tariffs";

export type OfferId = "base" | "hphc" | "tempo";
export const OFFERS: OfferId[] = ["base", "hphc", "tempo"];
export const OFFER_LABELS: Record<OfferId, string> = { base: "Base", hphc: "Heures creuses", tempo: "Tempo" };

export type TempoColor = "blue" | "white" | "red";
export const TEMPO_COLORS: TempoColor[] = ["blue", "white", "red"];
export const TEMPO_LABELS: Record<TempoColor, string> = { blue: "Bleu", white: "Blanc", red: "Rouge" };
const TEMPO_CSV_NAMES: Record<TempoColor, string> = { blue: "Bleu", white: "Blanc", red: "Rouge" };

export interface HcHp {
  hc: number;
  hp: number;
}

interface TariffCommon {
  power: number;
  subscription: number; // € per year, taxes included
  since: string; // dd/mm/yyyy
}

export type Tariff =
  | (TariffCommon & { offer: "base"; kwh: number })
  | (TariffCommon & { offer: "hphc"; hc: number; hp: number })
  | (TariffCommon & { offer: "tempo"; colors: Record<TempoColor, HcHp> });

const tables: Record<OfferId, TariffRow[]> = {
  base: parseTariffCsv(BASE_TARIFFS_CSV),
  hphc: parseTariffCsv(OFFPEAK_TARIFFS_CSV),
  tempo: parseTariffCsv(TEMPO_TARIFFS_CSV),
};

export function powersFor(offer: OfferId, now = new Date()): number[] {
  return availablePowers(tables[offer], now);
}

export function tariffFor(offer: OfferId, power: number, now = new Date()): Tariff | undefined {
  const row = findActiveRow(tables[offer], power, now);
  if (!row) return undefined;

  const common = { power, subscription: num(row.PART_FIXE_TTC), since: row.DATE_DEBUT };
  switch (offer) {
    case "base":
      return { ...common, offer, kwh: num(row.PART_VARIABLE_TTC) };
    case "hphc":
      return { ...common, offer, hc: num(row.PART_VARIABLE_HC_TTC), hp: num(row.PART_VARIABLE_HP_TTC) };
    case "tempo": {
      const color = (c: TempoColor): HcHp => ({
        hc: num(row[`PART_VARIABLE_HC${TEMPO_CSV_NAMES[c]}_TTC`]),
        hp: num(row[`PART_VARIABLE_HP${TEMPO_CSV_NAMES[c]}_TTC`]),
      });
      return { ...common, offer, colors: { blue: color("blue"), white: color("white"), red: color("red") } };
    }
  }
}

