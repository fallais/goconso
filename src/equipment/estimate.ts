import type { Tariff } from "../edf/offers";
import { averagePrice, type Profile } from "../simulation";
import { entry, type Kind, type Timing } from "./catalog";

export interface Equipment {
  id: string;
  kind: Kind;
  name: string;
  power: number; // W
  hours: number; // per day
  timing: Timing;
}

// Off-peak hours cover 8 hours a day.
export const HC_FRACTION: Record<Timing, number> = { day: 0, night: 1, spread: 8 / 24 };

export const annualKwh = (e: Equipment) => (e.power * e.hours * 365) / 1000;

export interface EquipmentEstimate {
  equipment: Equipment;
  kwh: number;
  cost?: number; // € per year, energy only
}

export interface EquipmentSummary {
  rows: EquipmentEstimate[];
  totalKwh: number;
  totalCost?: number;
  hcShare: number | null;
  peak: number; // W
}

export function summarizeEquipments(list: Equipment[], tariff: Tariff | undefined, profile: Profile): EquipmentSummary {
  const rows = list.map((equipment) => {
    const kwh = annualKwh(equipment);
    const cost = tariff && kwh * averagePrice(tariff, profile, HC_FRACTION[equipment.timing]);
    return { equipment, kwh, cost };
  });

  const totalKwh = rows.reduce((s, r) => s + r.kwh, 0);
  const hcKwh = rows.reduce((s, r) => s + r.kwh * HC_FRACTION[r.equipment.timing], 0);
  return {
    rows,
    totalKwh,
    totalCost: tariff && rows.reduce((s, r) => s + (r.cost ?? 0), 0),
    hcShare: totalKwh > 0 ? hcKwh / totalKwh : null,
    peak: estimatePeak(list),
  };
}

// Rough simultaneous load: every heavy load, plus the largest other appliance,
// plus the small ones that are usually on at the same time.
export function estimatePeak(list: Equipment[]): number {
  const heavy = list.filter((e) => entry(e.kind).heavy);
  const others = list.filter((e) => !entry(e.kind).heavy).sort((a, b) => b.power - a.power);
  const [largest, ...rest] = others;
  return (
    heavy.reduce((s, e) => s + e.power, 0) +
    (largest?.power ?? 0) +
    rest.filter((e) => e.power <= 300).reduce((s, e) => s + e.power, 0)
  );
}
