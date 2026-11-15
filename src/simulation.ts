import { OFFERS, TEMPO_COLORS, TEMPO_LABELS, tariffFor, type HcHp, type OfferId, type Tariff, type TempoColor } from "./edf/offers";

// How a yearly consumption splits between off-peak hours and Tempo day colors.
export interface Profile {
  total: number; // kWh per year
  hcShare: number; // 0..1, part consumed during off-peak hours
  colorShares: Record<TempoColor, number>; // sums to 1
  tempo?: Record<TempoColor, HcHp>; // exact kWh when read from a Tempo meter
}

export interface CostLine {
  label: string;
  kwh: number;
  unitPrice: number;
  amount: number;
}

export interface OfferCost {
  tariff: Tariff;
  subscription: number;
  energy: number;
  total: number;
  lines: CostLine[];
}

const line = (label: string, kwh: number, unitPrice: number): CostLine => ({
  label,
  kwh,
  unitPrice,
  amount: kwh * unitPrice,
});

export function tempoBuckets(profile: Profile): Record<TempoColor, HcHp> {
  if (profile.tempo) return profile.tempo;
  const bucket = (c: TempoColor): HcHp => {
    const kwh = profile.total * profile.colorShares[c];
    return { hc: kwh * profile.hcShare, hp: kwh * (1 - profile.hcShare) };
  };
  return { blue: bucket("blue"), white: bucket("white"), red: bucket("red") };
}

export function costFor(tariff: Tariff, profile: Profile): OfferCost {
  const hc = profile.total * profile.hcShare;
  const hp = profile.total - hc;

  let lines: CostLine[];
  switch (tariff.offer) {
    case "base":
      lines = [line("Consommation", profile.total, tariff.kwh)];
      break;
    case "hphc":
      lines = [line("Heures creuses", hc, tariff.hc), line("Heures pleines", hp, tariff.hp)];
      break;
    case "tempo": {
      const buckets = tempoBuckets(profile);
      lines = TEMPO_COLORS.flatMap((c) => [
        line(`${TEMPO_LABELS[c]} · HC`, buckets[c].hc, tariff.colors[c].hc),
        line(`${TEMPO_LABELS[c]} · HP`, buckets[c].hp, tariff.colors[c].hp),
      ]);
    }
  }

  const energy = lines.reduce((sum, l) => sum + l.amount, 0);
  return { tariff, subscription: tariff.subscription, energy, total: energy + tariff.subscription, lines };
}

export interface OfferResult {
  offer: OfferId;
  cost?: OfferCost; // undefined when the offer does not exist at this power
}

export function compareOffers(profile: Profile, power: number, now = new Date()): OfferResult[] {
  return OFFERS.map((offer) => {
    const tariff = tariffFor(offer, power, now);
    return { offer, cost: tariff && costFor(tariff, profile) };
  });
}

// Off-peak share above which Heures creuses becomes cheaper than Base, or null if not computable.
export function hphcBreakEven(power: number, total: number, now = new Date()): number | null {
  const base = tariffFor("base", power, now);
  const hphc = tariffFor("hphc", power, now);
  if (!base || base.offer !== "base" || !hphc || hphc.offer !== "hphc" || total <= 0) return null;
  if (hphc.hp === hphc.hc) return null;
  return (hphc.subscription - base.subscription + total * (hphc.hp - base.kwh)) / (total * (hphc.hp - hphc.hc));
}

// Average energy price (€/kWh) for consumption with the given off-peak fraction.
export function averagePrice(tariff: Tariff, profile: Profile, hcFraction: number): number {
  const mix = (p: HcHp) => hcFraction * p.hc + (1 - hcFraction) * p.hp;
  switch (tariff.offer) {
    case "base":
      return tariff.kwh;
    case "hphc":
      return mix(tariff);
    case "tempo":
      return TEMPO_COLORS.reduce((sum, c) => sum + profile.colorShares[c] * mix(tariff.colors[c]), 0);
  }
}
