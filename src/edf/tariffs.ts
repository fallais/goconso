export type TariffRow = Record<string, string>;

export function parseTariffCsv(raw: string): TariffRow[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const [header, ...records] = lines;
  const columns = header.split(";");
  return records.map((line) => {
    const fields = line.split(";");
    if (fields.length !== columns.length) {
      throw new Error(`malformed tariff line: ${line}`);
    }
    return Object.fromEntries(columns.map((c, i) => [c, fields[i]]));
  });
}

export function parseFrenchNumber(value: string): number {
  const n = Number(value.replace(",", "."));
  if (value.trim() === "" || Number.isNaN(n)) throw new Error(`invalid number: ${value}`);
  return n;
}

// "dd/mm/yyyy" -> "yyyy-mm-dd", which compares correctly as a string.
function toIsoDate(value: string): string {
  const [d, m, y] = value.split("/");
  return `${y}-${m}-${d}`;
}

function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Some historical rows exist without prices (e.g. Tempo before it was reopened).
function isActive(row: TariffRow, today: string): boolean {
  const start = toIsoDate(row.DATE_DEBUT);
  const end = row.DATE_FIN ? toIsoDate(row.DATE_FIN) : null;
  return row.PART_FIXE_TTC !== "" && start <= today && (end === null || today <= end);
}

export function findActiveRow(rows: TariffRow[], power: number, now: Date): TariffRow | undefined {
  const today = isoDay(now);
  return rows.find((r) => Number(r.P_SOUSCRITE) === power && isActive(r, today));
}

export function availablePowers(rows: TariffRow[], now: Date): number[] {
  const today = isoDay(now);
  const powers = rows.filter((r) => isActive(r, today)).map((r) => Number(r.P_SOUSCRITE));
  return [...new Set(powers)].sort((a, b) => a - b);
}
