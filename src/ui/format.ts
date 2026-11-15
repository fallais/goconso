const euro0 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const euro2 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const int = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const price = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

export const euros = (n: number) => euro0.format(n);
export const eurosCents = (n: number) => euro2.format(n);
export const kwh = (n: number) => `${int.format(n)} kWh`;
export const watts = (n: number) => (n >= 1000 ? `${(n / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} kW` : `${int.format(n)} W`);
export const percent = (share: number) => `${Math.round(share * 100)} %`;
export const unitPrice = (n: number) => `${price.format(n)} €`;
export const integer = (n: number) => int.format(n);
