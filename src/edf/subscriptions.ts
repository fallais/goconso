import { BASE_TARIFFS_CSV } from "./baseTariffs";
import { OFFPEAK_TARIFFS_CSV } from "./offpeakTariffs";
import { availablePowers, findActiveRow, parseFrenchNumber, parseTariffCsv } from "./tariffs";

const baseRows = parseTariffCsv(BASE_TARIFFS_CSV);
const offPeakRows = parseTariffCsv(OFFPEAK_TARIFFS_CSV);

export interface BaseSummary {
  index: number;
  subscription: number;
  consumption: number;
  total: number;
  tariffStart: string;
}

export interface OffPeakSummary {
  indexHC: number;
  indexHP: number;
  index: number;
  priceHC: number;
  priceHP: number;
  subscription: number;
  total: number;
  tariffStart: string;
}

export const basePowers = (now = new Date()) => availablePowers(baseRows, now);
export const offPeakPowers = (now = new Date()) => availablePowers(offPeakRows, now);

export function baseSummary(power: number, index: number, now = new Date()): BaseSummary {
  const row = findActiveRow(baseRows, power, now);
  if (!row) throw new Error(`Puissance invalide (${power} kVA) pour l'option Base`);

  const subscription = parseFrenchNumber(row.PART_FIXE_TTC);
  const kwh = parseFrenchNumber(row.PART_VARIABLE_TTC);
  const consumption = index * kwh;
  return { index, subscription, consumption, total: consumption + subscription, tariffStart: row.DATE_DEBUT };
}

export function offPeakSummary(power: number, indexHC: number, indexHP: number, now = new Date()): OffPeakSummary {
  const row = findActiveRow(offPeakRows, power, now);
  if (!row) throw new Error(`Puissance invalide (${power} kVA) pour l'option Heures Creuses`);

  const subscription = parseFrenchNumber(row.PART_FIXE_TTC);
  const priceHC = indexHC * parseFrenchNumber(row.PART_VARIABLE_HC_TTC);
  const priceHP = indexHP * parseFrenchNumber(row.PART_VARIABLE_HP_TTC);
  return {
    indexHC,
    indexHP,
    index: indexHC + indexHP,
    priceHC,
    priceHP,
    subscription,
    total: priceHC + priceHP + subscription,
    tariffStart: row.DATE_DEBUT,
  };
}
