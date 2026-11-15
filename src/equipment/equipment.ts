export type OperatingHours = "day" | "night" | "always";

export interface Equipment {
  name: string;
  power: number; // W
  operatingHours: OperatingHours;
}

export const generic = (name: string, power: number, operatingHours: OperatingHours): Equipment => ({
  name,
  power,
  operatingHours,
});

export const fridge = (hours: OperatingHours = "always") => generic("Frigo", 200, hours);
export const radiator = (hours: OperatingHours = "always") => generic("Radiateur", 2000, hours);
export const hotWaterTank = (hours: OperatingHours = "always") => generic("Ballon d'eau chaude", 200, hours);
export const dishwasher = (hours: OperatingHours = "night") => generic("Lave-vaisselle", 2000, hours);

export const defaultEquipments = (): Equipment[] => [];
