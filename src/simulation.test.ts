import { describe, expect, it } from "vitest";
import { parseConfig } from "./config";
import { powersFor, tariffFor } from "./edf/offers";
import { annualKwh, estimatePeak, summarizeEquipments, type Equipment } from "./equipment/estimate";
import { compareOffers, costFor, hphcBreakEven, type Profile } from "./simulation";
import { decodeShare, defaultState, encodeShare, profileFrom, sanitizeState } from "./state";

// The original Go version used the tariffs in force from 01/08/2023.
const goEra = new Date(2023, 9, 1);
const now = new Date(2026, 10, 15);

const flat = (total: number, hcShare: number): Profile => ({
  total,
  hcShare,
  colorShares: { blue: 300 / 365, white: 43 / 365, red: 22 / 365 },
});

describe("parity with the Go version", () => {
  it("heures creuses 9 kVA, 1900 HC / 2800 HP", () => {
    const profile = flat(4700, 1900 / 4700);
    const hphc = costFor(tariffFor("hphc", 9, goEra)!, profile);
    expect(hphc.lines.map((l) => l.amount.toFixed(2))).toEqual(["347.32", "688.80"]);
    expect(hphc.subscription.toFixed(2)).toBe("198.43");
    expect(hphc.total.toFixed(2)).toBe("1234.55");
    expect(costFor(tariffFor("base", 9, goEra)!, profile).total.toFixed(2)).toBe("1258.73");
  });

  it("base 6 kVA, 4700 kWh", () => {
    const base = costFor(tariffFor("base", 6, goEra)!, flat(4700, 0));
    expect(base.subscription.toFixed(2)).toBe("149.96");
    expect(base.total.toFixed(2)).toBe("1219.68");
  });
});

describe("tariffs", () => {
  it("lists the powers of each offer", () => {
    expect(powersFor("base", now)).toEqual([3, 6, 9, 12, 15]);
    expect(powersFor("hphc", now)).toEqual([3, 6, 9, 12, 15, 18, 24, 30, 36]);
    expect(powersFor("tempo", now)).toEqual([6, 9, 12, 15, 18, 24, 30, 36]);
  });

  it("uses the tariffs in force since 01/08/2026", () => {
    const t = tariffFor("tempo", 6, now)!;
    expect(t.since).toBe("01/08/2026");
    if (t.offer !== "tempo") throw new Error("wrong offer");
    expect(t.colors.red.hp).toBe(0.7295);
  });

  it("treats the end date as inclusive", () => {
    expect(tariffFor("base", 6, new Date(2026, 6, 31))!.since).toBe("01/02/2026");
  });

  it("returns nothing for a power that does not exist", () => {
    expect(tariffFor("base", 18, now)).toBeUndefined();
    expect(tariffFor("tempo", 3, now)).toBeUndefined();
  });
});

describe("simulation", () => {
  it("prices Tempo from exact readings", () => {
    const tempo = { blue: { hc: 1000, hp: 0 }, white: { hc: 0, hp: 0 }, red: { hc: 0, hp: 100 } };
    const cost = costFor(tariffFor("tempo", 6, now)!, { ...flat(1100, 0), tempo });
    if (cost.tariff.offer !== "tempo") throw new Error("wrong offer");
    const { colors, subscription } = cost.tariff;
    expect(cost.total).toBeCloseTo(subscription + 1000 * colors.blue.hc + 100 * colors.red.hp, 9);
  });

  it("marks unavailable offers", () => {
    const results = compareOffers(flat(3000, 0.3), 3, now);
    expect(results.map((r) => [r.offer, r.cost !== undefined])).toEqual([
      ["base", true],
      ["hphc", true],
      ["tempo", false],
    ]);
  });

  it("finds the Heures creuses break-even share", () => {
    const share = hphcBreakEven(9, 4700, now)!;
    const at = (s: number) => compareOffers(flat(4700, s), 9, now);
    const [base, hphc] = at(share);
    expect(base.cost!.total).toBeCloseTo(hphc.cost!.total, 6);
    expect(share).toBeGreaterThan(0);
    expect(share).toBeLessThan(1);
  });

  it("derives the profile from the current option readings", () => {
    const s = defaultState();
    expect(profileFrom({ ...s, offer: "hphc" })).toMatchObject({ total: 4700, hcShare: 1900 / 4700 });
    expect(profileFrom({ ...s, offer: "base" })).toMatchObject({ total: 4700, hcShare: s.hcShare });
    const tempo = profileFrom({ ...s, offer: "tempo" });
    expect(tempo.total).toBe(4700);
    expect(tempo.colorShares.blue + tempo.colorShares.white + tempo.colorShares.red).toBeCloseTo(1, 9);
  });
});

describe("equipments", () => {
  const e = (over: Partial<Equipment>): Equipment => ({
    id: "x",
    kind: "other",
    name: "x",
    power: 1000,
    hours: 1,
    timing: "day",
    ...over,
  });

  it("estimates yearly consumption and off-peak share", () => {
    expect(annualKwh(e({ power: 2000, hours: 0.5 }))).toBe(365);
    const summary = summarizeEquipments(
      [e({ timing: "night" }), e({ timing: "day" })],
      tariffFor("base", 6, now),
      flat(1000, 0.3),
    );
    expect(summary.totalKwh).toBe(730);
    expect(summary.hcShare).toBe(0.5);
    expect(summary.totalCost).toBeCloseTo(730 * 0.2001, 9);
  });

  it("estimates the peak load", () => {
    const list = [
      e({ kind: "radiator", power: 1500 }),
      e({ kind: "radiator", power: 1500 }),
      e({ kind: "oven", power: 2500 }),
      e({ kind: "hob", power: 3000 }),
      e({ kind: "tv", power: 100 }),
    ];
    expect(estimatePeak(list)).toBe(1500 + 1500 + 3000 + 100);
  });
});

describe("state", () => {
  it("round-trips through a share link", () => {
    const s = { ...defaultState(), equipments: [{ id: "a", kind: "tv" as const, name: "Télé 📺", power: 90, hours: 3, timing: "day" as const }] };
    expect(decodeShare(encodeShare(s))).toEqual(s);
  });

  it("sanitizes untrusted input", () => {
    const s = sanitizeState({
      offer: "nope",
      power: -4,
      readings: { total: "1e9", hc: Infinity },
      equipments: [{ kind: "spaceship" }, { kind: "tv", name: "<b>x</b>".repeat(20), hours: 99 }],
    });
    expect(s.offer).toBe("hphc");
    expect(s.power).toBe(1);
    expect(s.readings.total).toBe(4700);
    expect(s.readings.hc).toBe(1900);
    expect(s.equipments).toHaveLength(1);
    expect(s.equipments[0].name).toHaveLength(60);
    expect(s.equipments[0].hours).toBe(24);
  });

  it("ignores broken share links", () => {
    expect(decodeShare("#s=%%%")).toBeNull();
    expect(decodeShare("#other")).toBeNull();
  });
});

describe("parseConfig", () => {
  it("reads the YAML file", () => {
    const yml = `option: "heures_creuses"\npuissance: 9\nindex:\n  heures_creuses: 1900\n  heures_pleines: 2800\n`;
    expect(parseConfig(yml, defaultState())).toMatchObject({ offer: "hphc", power: 9, readings: { hc: 1900, hp: 2800 } });
  });

  it("reads Tempo indexes", () => {
    const yml = `option: tempo\npuissance: 6\nindex:\n  bleu_hc: 10\n  rouge_hp: 5\n`;
    const s = parseConfig(yml, defaultState());
    expect(s.readings.tempo.blue.hc).toBe(10);
    expect(s.readings.tempo.red.hp).toBe(5);
  });

  it("rejects unknown options", () => {
    expect(() => parseConfig("option: ejp\npuissance: 6", defaultState())).toThrow(/ejp/);
  });
});
