import { baseSummary, offPeakSummary, type BaseSummary, type OffPeakSummary } from "./edf/subscriptions";
import type { Equipment } from "./equipment/equipment";

export type Option = "base" | "heures_creuses";

export interface ConsumptionInput {
  option: Option;
  power: number;
  index: {
    total?: number;
    heures_creuses?: number;
    heures_pleines?: number;
  };
}

export type Analysis =
  | { option: "base"; power: number; base: BaseSummary }
  | {
      option: "heures_creuses";
      power: number;
      offPeak: OffPeakSummary;
      base: BaseSummary;
      // Positive when Base would have cost more than the current HC/HP option.
      baseExtraCost: number;
      percentHC: number;
      percentHP: number;
    };

export function analyze(input: ConsumptionInput, now = new Date()): Analysis {
  const { option, power, index } = input;

  if (option === "base") {
    return { option, power, base: baseSummary(power, index.total ?? 0, now) };
  }

  const hc = index.heures_creuses ?? 0;
  const hp = index.heures_pleines ?? 0;
  const offPeak = offPeakSummary(power, hc, hp, now);
  const base = baseSummary(power, hc + hp, now);
  const total = offPeak.index;

  return {
    option,
    power,
    offPeak,
    base,
    baseExtraCost: base.total - offPeak.total,
    percentHC: total ? Math.trunc((hc * 100) / total) : 0,
    percentHP: total ? Math.trunc((hp * 100) / total) : 0,
  };
}

export type EquipmentTrend = "day" | "night" | "balanced";

export interface EquipmentAnalysis {
  count: number;
  runningDay: number;
  runningNight: number;
  trend: EquipmentTrend;
}

export function analyzeEquipments(equipments: Equipment[]): EquipmentAnalysis {
  let runningDay = 0;
  let runningNight = 0;

  for (const e of equipments) {
    if (e.operatingHours === "day" || e.operatingHours === "always") runningDay++;
    if (e.operatingHours === "night" || e.operatingHours === "always") runningNight++;
  }

  const trend: EquipmentTrend =
    runningDay > runningNight ? "day" : runningDay < runningNight ? "night" : "balanced";

  return { count: equipments.length, runningDay, runningNight, trend };
}
