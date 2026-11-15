import { analyze, analyzeEquipments, type Analysis, type ConsumptionInput, type Option } from "./analyzer";
import { basePowers, offPeakPowers } from "./edf/subscriptions";
import { defaultEquipments, generic, type Equipment, type OperatingHours } from "./equipment/equipment";

const STORAGE_KEY = "goconso";

interface State {
  input: ConsumptionInput;
  equipments: Equipment[];
}

const defaultState = (): State => ({
  input: { option: "heures_creuses", power: 9, index: { heures_creuses: 1900, heures_pleines: 2800, total: 4700 } },
  equipments: defaultEquipments(),
});

function loadState(): State {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultState(), ...JSON.parse(saved) };
  } catch {
    // Corrupted storage: fall back to defaults.
  }
  return defaultState();
}

const state = loadState();
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const form = $<HTMLFormElement>("#subscription");
const field = <T extends HTMLInputElement | HTMLSelectElement>(name: string) => form.elements.namedItem(name) as T;

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const kwh = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n)} kWh`;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// HC/HP is compared against Base, so the power must exist in both tariffs.
function powersFor(option: Option): number[] {
  const base = basePowers();
  return option === "base" ? base : offPeakPowers().filter((p) => base.includes(p));
}

function closest(values: number[], target: number): number {
  return values.reduce((best, v) => (Math.abs(v - target) < Math.abs(best - target) ? v : best), values[0]);
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

function syncForm() {
  const { option, power, index } = state.input;
  field<HTMLSelectElement>("option").value = option;

  const powers = powersFor(option);
  if (!powers.includes(power)) state.input.power = closest(powers, power);
  const powerSelect = field<HTMLSelectElement>("power");
  powerSelect.innerHTML = powers.map((p) => `<option value="${p}">${p} kVA</option>`).join("");
  powerSelect.value = String(state.input.power);

  for (const name of ["total", "heures_creuses", "heures_pleines"] as const) {
    field<HTMLInputElement>(name).value = index[name]?.toString() ?? "";
  }
  form.querySelectorAll<HTMLElement>("[data-option]").forEach((el) => {
    el.hidden = el.dataset.option !== option;
  });
}

function readForm() {
  const num = (name: string) => {
    const v = field<HTMLInputElement>(name).value;
    return v === "" ? undefined : Number(v);
  };
  state.input = {
    option: field<HTMLSelectElement>("option").value as Option,
    power: Number(field<HTMLSelectElement>("power").value),
    index: { total: num("total"), heures_creuses: num("heures_creuses"), heures_pleines: num("heures_pleines") },
  };
}

function renderResults() {
  const error = $("#error");
  const results = $("#results");
  let analysis: Analysis;
  try {
    analysis = analyze(state.input);
    error.hidden = true;
  } catch (e) {
    error.textContent = (e as Error).message;
    error.hidden = false;
    results.innerHTML = "";
    return;
  }
  results.innerHTML = analysis.option === "base" ? baseResults(analysis) : offPeakResults(analysis);
}

function row(label: string, value: string, detail = "") {
  return `<tr><th>${label}</th><td>${value}</td><td class="muted">${detail}</td></tr>`;
}

function baseResults(a: Extract<Analysis, { option: "base" }>) {
  return `
    <h2>Détails — Base ${a.power} kVA</h2>
    <table class="details">
      ${row("Abonnement", euro.format(a.base.subscription), "par an")}
      ${row("Consommation", euro.format(a.base.consumption), kwh(a.base.index))}
      ${row("Prix total", `<strong>${euro.format(a.base.total)}</strong>`)}
    </table>
    <h3>Conclusion</h3>
    <p>L'option <code>HC/HP</code> ne vaut le coup que si la majorité de votre consommation se fait la nuit.</p>
    <p class="muted">Tarif en vigueur depuis le ${a.base.tariffStart}.</p>`;
}

function offPeakResults(a: Extract<Analysis, { option: "heures_creuses" }>) {
  const { offPeak, base, baseExtraCost } = a;
  const conclusion =
    baseExtraCost >= 0
      ? `L'option <code>Base</code> ne vaut pas le coup, elle aurait coûté ${euro.format(base.total)}
         (plus chère de <strong>${euro.format(baseExtraCost)}</strong>).`
      : `L'option <code>Base</code> vaut le coup, elle aurait coûté ${euro.format(base.total)}
         (<strong>${euro.format(-baseExtraCost)}</strong> d'économies).`;

  return `
    <h2>Détails — Heures creuses ${a.power} kVA</h2>
    <table class="details">
      ${row("Heures creuses", euro.format(offPeak.priceHC), kwh(offPeak.indexHC))}
      ${row("Heures pleines", euro.format(offPeak.priceHP), kwh(offPeak.indexHP))}
      ${row("Abonnement", euro.format(offPeak.subscription), "par an")}
      ${row("Prix total", `<strong>${euro.format(offPeak.total)}</strong>`, kwh(offPeak.index))}
    </table>
    <h3>Conclusion</h3>
    <p class="${baseExtraCost >= 0 ? "good" : "bad"}">${conclusion}</p>
    <div class="split" role="img" aria-label="Répartition heures creuses / heures pleines">
      <div class="hc" style="flex: ${a.percentHC}">HC ${a.percentHC}%</div>
      <div class="hp" style="flex: ${a.percentHP}">HP ${a.percentHP}%</div>
    </div>
    <p>Les heures creuses représentent ${a.percentHC}% de la consommation,
       les heures pleines ${a.percentHP}%.</p>
    <p class="muted">Tarifs en vigueur depuis le ${offPeak.tariffStart}.</p>`;
}

form.addEventListener("input", (e) => {
  readForm();
  if ((e.target as HTMLElement).getAttribute("name") === "option") syncForm();
  save();
  renderResults();
});

$<HTMLInputElement>("#import").addEventListener("change", async (e) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    const { parseConfig } = await import("./config");
    state.input = parseConfig(await file.text());
    syncForm();
    save();
    renderResults();
  } catch (err) {
    const error = $("#error");
    error.textContent = `Import impossible : ${(err as Error).message}`;
    error.hidden = false;
  }
});

// ---------------------------------------------------------------------------
// Equipments
// ---------------------------------------------------------------------------

const HOURS: Record<OperatingHours, string> = { day: "Le jour", night: "La nuit", always: "Toujours" };
const TRENDS = {
  day: "Vos équipements fonctionnent plutôt le jour.",
  night: "Vos équipements fonctionnent plutôt la nuit.",
  balanced: "Vos équipements fonctionnent aussi bien le jour que la nuit.",
};

function renderEquipments() {
  $("#equipments").innerHTML = state.equipments
    .map(
      (e, i) => `
      <tr data-index="${i}">
        <td><input name="name" value="${escapeHtml(e.name)}" aria-label="Nom" /></td>
        <td><input name="power" type="number" min="0" value="${e.power}" aria-label="Puissance" /></td>
        <td>
          <select name="operatingHours" aria-label="Fonctionnement">
            ${Object.entries(HOURS)
              .map(([v, l]) => `<option value="${v}" ${v === e.operatingHours ? "selected" : ""}>${l}</option>`)
              .join("")}
          </select>
        </td>
        <td><button type="button" class="icon" data-remove aria-label="Supprimer">✕</button></td>
      </tr>`,
    )
    .join("");
  renderEquipmentSummary();
}

function renderEquipmentSummary() {
  const a = analyzeEquipments(state.equipments);
  $("#equipment-summary").innerHTML =
    `<strong>${a.count}</strong> équipements — ${a.runningDay} actifs le jour, ${a.runningNight} la nuit. ` +
    TRENDS[a.trend];
}

$("#equipments").addEventListener("input", (e) => {
  const target = e.target as HTMLInputElement | HTMLSelectElement;
  const index = Number(target.closest("tr")!.dataset.index);
  const equipment = state.equipments[index];
  if (target.name === "name") equipment.name = target.value;
  if (target.name === "power") equipment.power = Number(target.value);
  if (target.name === "operatingHours") equipment.operatingHours = target.value as OperatingHours;
  save();
  renderEquipmentSummary();
});

$("#equipments").addEventListener("click", (e) => {
  const button = (e.target as HTMLElement).closest("[data-remove]");
  if (!button) return;
  state.equipments.splice(Number(button.closest("tr")!.dataset.index), 1);
  save();
  renderEquipments();
});

$("#add-equipment").addEventListener("click", () => {
  state.equipments.push(generic("Nouvel équipement", 100, "day"));
  save();
  renderEquipments();
  $<HTMLInputElement>("#equipments tr:last-child input[name=name]").select();
});

$("#reset-equipments").addEventListener("click", () => {
  state.equipments = defaultEquipments();
  save();
  renderEquipments();
});

syncForm();
renderResults();
renderEquipments();
