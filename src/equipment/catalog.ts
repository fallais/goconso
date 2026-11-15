export type Timing = "day" | "night" | "spread";

export interface CatalogEntry {
  label: string;
  power: number; // W, nominal
  hours: number; // average hours per day over a year, at nominal power
  timing: Timing;
  heavy?: true; // long, simultaneous loads (heating, hot water, EV) used for the peak estimate
}

// Typical values for a French household; every field stays editable.
export const CATALOG = {
  fridge: { label: "Réfrigérateur", power: 100, hours: 6, timing: "spread" },
  freezer: { label: "Congélateur", power: 100, hours: 8, timing: "spread" },
  washer: { label: "Lave-linge", power: 2000, hours: 0.3, timing: "night" },
  dishwasher: { label: "Lave-vaisselle", power: 2000, hours: 0.4, timing: "night" },
  dryer: { label: "Sèche-linge", power: 2500, hours: 0.3, timing: "night" },
  oven: { label: "Four", power: 2500, hours: 0.2, timing: "day" },
  hob: { label: "Plaques de cuisson", power: 3000, hours: 0.3, timing: "day" },
  microwave: { label: "Micro-ondes", power: 1000, hours: 0.15, timing: "day" },
  kettle: { label: "Bouilloire, cafetière", power: 2000, hours: 0.1, timing: "day" },
  waterHeater: { label: "Ballon d'eau chaude", power: 2400, hours: 2, timing: "night", heavy: true },
  radiator: { label: "Radiateur", power: 1500, hours: 3, timing: "spread", heavy: true },
  heatPump: { label: "Pompe à chaleur", power: 2500, hours: 4, timing: "spread", heavy: true },
  airCon: { label: "Climatisation", power: 1500, hours: 1, timing: "day", heavy: true },
  ev: { label: "Voiture électrique", power: 7400, hours: 1, timing: "night", heavy: true },
  tv: { label: "Télévision", power: 100, hours: 4, timing: "day" },
  computer: { label: "Ordinateur", power: 150, hours: 4, timing: "day" },
  console: { label: "Console de jeu", power: 150, hours: 1.5, timing: "day" },
  router: { label: "Box internet", power: 15, hours: 24, timing: "spread" },
  lighting: { label: "Éclairage", power: 150, hours: 4, timing: "day" },
  pool: { label: "Pompe de piscine", power: 800, hours: 4, timing: "day" },
  other: { label: "Autre appareil", power: 100, hours: 1, timing: "day" },
} satisfies Record<string, CatalogEntry>;

export type Kind = keyof typeof CATALOG;
export const KINDS = Object.keys(CATALOG) as Kind[];

export const entry = (kind: Kind): CatalogEntry => CATALOG[kind];
