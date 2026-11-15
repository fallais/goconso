import { describe, expect, it } from "vitest";
import { analyze, analyzeEquipments } from "./analyzer";
import { parseConfig } from "./config";
import { basePowers, offPeakPowers } from "./edf/subscriptions";
import { dishwasher, fridge, radiator } from "./equipment/equipment";

// Expected values come from running the original Go version, whose latest tariffs dated from 01/08/2023.
const goEra = new Date(2023, 9, 1);
const now = new Date(2026, 10, 15);

describe("analyze (parity with Go)", () => {
  it("heures_creuses 9 kVA", () => {
    const a = analyze(
      { option: "heures_creuses", power: 9, index: { heures_creuses: 1900, heures_pleines: 2800 } },
      goEra,
    );
    if (a.option !== "heures_creuses") throw new Error("wrong option");
    expect(a.offPeak.priceHC.toFixed(2)).toBe("347.32");
    expect(a.offPeak.priceHP.toFixed(2)).toBe("688.80");
    expect(a.offPeak.subscription.toFixed(2)).toBe("198.43");
    expect(a.offPeak.total.toFixed(2)).toBe("1234.55");
    expect(a.offPeak.index).toBe(4700);
    expect(a.base.total.toFixed(2)).toBe("1258.73");
    expect(a.baseExtraCost.toFixed(2)).toBe("24.18");
    expect(a.percentHC).toBe(40);
    expect(a.percentHP).toBe(59);
  });

  it("base 6 kVA", () => {
    const a = analyze({ option: "base", power: 6, index: { total: 4700 } }, goEra);
    expect(a.base.subscription.toFixed(2)).toBe("149.96");
    expect(a.base.total.toFixed(2)).toBe("1219.68");
  });
});

describe("analyze", () => {
  it("uses the tariffs in force since 01/08/2026", () => {
    const a = analyze({ option: "base", power: 6, index: { total: 1000 } }, now);
    expect(a.base.tariffStart).toBe("01/08/2026");
    expect(a.base.subscription).toBe(190.81);
    expect(a.base.total).toBeCloseTo(190.81 + 200.1, 6);
  });

  it("treats the end date as inclusive", () => {
    const a = analyze({ option: "base", power: 6, index: { total: 0 } }, new Date(2026, 6, 31));
    expect(a.base.tariffStart).toBe("01/02/2026");
  });

  it("rejects a power without tariff", () => {
    expect(() => analyze({ option: "base", power: 18, index: { total: 4700 } }, now)).toThrow(/18 kVA/);
  });

  it("handles empty indexes", () => {
    const a = analyze({ option: "heures_creuses", power: 6, index: {} }, now);
    if (a.option !== "heures_creuses") throw new Error("wrong option");
    expect(a.percentHC).toBe(0);
  });

  it("uses historical tariffs for past dates", () => {
    const a = analyze({ option: "base", power: 9, index: { total: 1000 } }, new Date(2022, 2, 1));
    expect(a.base.subscription).toBe(170.09);
    expect(a.base.total).toBeCloseTo(170.09 + 174, 6);
  });
});

describe("powers", () => {
  it("lists current powers", () => {
    expect(basePowers(now)).toEqual([3, 6, 9, 12, 15]);
    expect(offPeakPowers(now)).toEqual([3, 6, 9, 12, 15, 18, 24, 30, 36]);
    expect(offPeakPowers(goEra)).toEqual([6, 9, 12, 15, 18, 24, 30, 36]);
  });
});

describe("analyzeEquipments", () => {
  it("counts day and night usage", () => {
    expect(analyzeEquipments([fridge(), dishwasher(), radiator("day")])).toEqual({
      count: 3,
      runningDay: 2,
      runningNight: 2,
      trend: "balanced",
    });
  });
});

describe("parseConfig", () => {
  it("reads the legacy YAML file", () => {
    const yml = `option: "heures_creuses"\npuissance: 9\nindex:\n  heures_creuses: 1900\n  heures_pleines: 2800\n`;
    expect(parseConfig(yml)).toEqual({
      option: "heures_creuses",
      power: 9,
      index: { total: undefined, heures_creuses: 1900, heures_pleines: 2800 },
    });
  });

  it("rejects unknown options", () => {
    expect(() => parseConfig("option: tempo\npuissance: 6")).toThrow(/tempo/);
  });
});
