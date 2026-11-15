// Refreshes src/edf/*Tariffs.ts from the CRE open data (EDF regulated tariffs history).
import { writeFile } from "node:fs/promises";

const BASE_URL = "https://www.cre.fr/fileadmin/Documents/Open_data/Marches_de_detail";

const files = [
  {
    csv: "Option_Base.csv",
    out: "src/edf/baseTariffs.ts",
    constName: "BASE_TARIFFS_CSV",
    header: 'EDF regulated "Base" tariffs (yearly fixed part and kWh price, in €).',
    firstColumns: "DATE_DEBUT;DATE_FIN;P_SOUSCRITE;PART_FIXE_HT;PART_FIXE_TTC;PART_VARIABLE_HT;PART_VARIABLE_TTC",
  },
  {
    csv: "Option_HPHC.csv",
    out: "src/edf/offpeakTariffs.ts",
    constName: "OFFPEAK_TARIFFS_CSV",
    header: 'EDF regulated "Heures Creuses" tariffs (yearly fixed part and kWh prices, in €).',
    firstColumns:
      "DATE_DEBUT;DATE_FIN;P_SOUSCRITE;PART_FIXE_HT;PART_FIXE_TTC;PART_VARIABLE_HC_HT;PART_VARIABLE_HC_TTC;PART_VARIABLE_HP_HT;PART_VARIABLE_HP_TTC",
  },
];

for (const f of files) {
  const url = `${BASE_URL}/${f.csv}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);

  const lines = (await res.text()).split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines[0].replace(/^﻿/, "") !== f.firstColumns) {
    throw new Error(`${f.csv}: unexpected header, the format changed:\n${lines[0]}`);
  }
  if (lines.some((l) => l.includes("`"))) throw new Error(`${f.csv}: unexpected backtick`);

  const ts = `// ${f.header}\n// Source: ${url}\nexport const ${f.constName} = \`\n${lines.join("\n")}\n\`;\n`;
  await writeFile(f.out, ts);
  console.log(`${f.out}: ${lines.length - 1} rows`);
}
