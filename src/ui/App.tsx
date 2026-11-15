import { Check, Link, Upload, Zap } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { powersFor } from "../edf/offers";
import { summarizeEquipments } from "../equipment/estimate";
import { compareOffers } from "../simulation";
import { encodeShare, loadState, profileFrom, saveState, type State } from "../state";
import { Assumptions } from "./Assumptions";
import { Contract } from "./Contract";
import { Equipments } from "./Equipments";
import { Verdict } from "./Verdict";

// Keep the subscribed power valid for the selected option.
function normalize(state: State): State {
  const powers = powersFor(state.offer);
  if (powers.includes(state.power) || powers.length === 0) return state;
  const closest = powers.reduce((best, p) => (Math.abs(p - state.power) < Math.abs(best - state.power) ? p : best));
  return { ...state, power: closest };
}

export function App() {
  const [state, setState] = useState(() => normalize(loadState()));
  const [toast, setToast] = useState<string | null>(null);
  const update = (fn: (s: State) => State) => setState((s) => normalize(fn(s)));

  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const profile = useMemo(() => profileFrom(state), [state]);
  const results = useMemo(() => compareOffers(profile, state.power), [profile, state.power]);
  const tariff = results.find((r) => r.offer === state.offer)?.cost?.tariff;
  const summary = useMemo(
    () => summarizeEquipments(state.equipments, tariff, profile),
    [state.equipments, tariff, profile],
  );

  const share = async () => {
    const url = location.origin + location.pathname + encodeShare(state);
    try {
      await navigator.clipboard.writeText(url);
      setToast("Lien copié : il contient votre simulation et vos appareils.");
    } catch {
      window.prompt("Copiez ce lien :", url);
    }
  };

  const importFile = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const { parseConfig } = await import("../config");
      const text = await file.text();
      update((s) => parseConfig(text, s));
      setToast(`${file.name} importé.`);
    } catch (err) {
      setToast(`Import impossible : ${(err as Error).message}`);
    }
  };

  const since = results.find((r) => r.cost)?.cost?.tariff.since;

  return (
    <>
      <header class="topbar">
        <a class="brand" href="./" aria-label="GoConso, accueil">
          <span class="brand-mark">
            <Zap size={18} strokeWidth={2.5} />
          </span>
          goconso
        </a>
        <div class="topbar-actions">
          <label class="button ghost" title="Importer un fichier ma_conso.yml">
            <Upload size={16} />
            <span>Importer</span>
            <input type="file" accept=".yml,.yaml" hidden aria-label="Importer un fichier ma_conso.yml" onChange={importFile} />
          </label>
          <button type="button" class="button" aria-label="Copier le lien de partage" onClick={share}>
            {toast?.startsWith("Lien") ? <Check size={16} /> : <Link size={16} />}
            <span>Partager</span>
          </button>
        </div>
      </header>

      <div class="hero">
        <h1>
          Base, Heures creuses ou Tempo&nbsp;?
          <br />
          <span>Payez le juste prix pour votre électricité.</span>
        </h1>
      </div>

      <main class="layout">
        <div class="columns">
          <div class="column inputs">
            <Contract state={state} update={update} />
            <Assumptions state={state} update={update} profile={profile} equipmentHcShare={summary.hcShare} />
          </div>
          <div class="column result">
            <Verdict offer={state.offer} results={results} profile={profile} power={state.power} />
          </div>
        </div>
        <Equipments state={state} update={update} summary={summary} tariff={tariff} declaredKwh={profile.total} />
      </main>

      <footer class="footer">
        <p>
          Tarifs réglementés EDF TTC{since && <> en vigueur depuis le {since}</>}, issus de l'
          <a href="https://www.data.gouv.fr/datasets/historique-des-tarifs-reglementes-de-vente-delectricite-pour-les-consommateurs-residentiels">
            open data de la CRE
          </a>
          .
        </p>
        <p>
          Tout est calculé dans votre navigateur, rien n'est envoyé. ·{" "}
          <a href="https://github.com/fallais/goconso">Code source</a>
        </p>
      </footer>

      <div class={`toast ${toast ? "show" : ""}`} role="status">
        {toast}
      </div>
    </>
  );
}
