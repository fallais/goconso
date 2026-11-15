import { Clock, Moon, Plus, Sun, X } from "lucide-preact";
import { powersFor, tariffFor, type Tariff } from "../edf/offers";
import { CATALOG, KINDS, type Kind, type Timing } from "../equipment/catalog";
import type { Equipment, EquipmentSummary } from "../equipment/estimate";
import { newId, type State } from "../state";
import { NumberField, SectionTitle, Segmented } from "./controls";
import { euros, integer, kwh, percent, watts } from "./format";
import { KIND_ICONS } from "./icons";

interface Props {
  state: State;
  update: (fn: (s: State) => State) => void;
  summary: EquipmentSummary;
  tariff?: Tariff;
  declaredKwh: number;
}

const TIMING_OPTIONS: { value: Timing; label: preact.ComponentChildren; title: string }[] = [
  { value: "day", label: <Sun size={16} />, title: "En journée (heures pleines)" },
  { value: "night", label: <Moon size={16} />, title: "La nuit (heures creuses)" },
  { value: "spread", label: <Clock size={16} />, title: "En continu" },
];

export function Equipments({ state, update, summary, tariff, declaredKwh }: Props) {
  const setEquipment = (id: string, patch: Partial<Equipment>) =>
    update((s) => ({ ...s, equipments: s.equipments.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  const remove = (id: string) => update((s) => ({ ...s, equipments: s.equipments.filter((e) => e.id !== id) }));
  const add = (kind: Kind) => {
    const c = CATALOG[kind];
    const count = state.equipments.filter((e) => e.kind === kind).length;
    const name = count ? `${c.label} ${count + 1}` : c.label;
    update((s) => ({
      ...s,
      equipments: [...s.equipments, { id: newId(), kind, name, power: c.power, hours: c.hours, timing: c.timing }],
    }));
  };

  const maxKwh = Math.max(1, ...summary.rows.map((r) => r.kwh));

  return (
    <section class="panel equipments" aria-labelledby="equipments-title">
      <SectionTitle
        index="03"
        aside={
          state.equipments.length > 0 && (
            <button type="button" class="link" onClick={() => update((s) => ({ ...s, equipments: [] }))}>
              Tout retirer
            </button>
          )
        }
      >
        <span id="equipments-title">Vos appareils</span>
      </SectionTitle>
      <p class="intro">
        Estimez ce que coûte chaque appareil, la part de votre consommation la nuit et la puissance dont vous avez
        besoin. Les valeurs proposées sont des moyennes, ajustez-les.
      </p>

      <div class="catalog" role="group" aria-label="Ajouter un appareil">
        {KINDS.map((kind) => {
          const Icon = KIND_ICONS[kind];
          return (
            <button type="button" class="chip" key={kind} onClick={() => add(kind)}>
              <Icon size={16} />
              {CATALOG[kind].label}
              <Plus size={14} class="chip-plus" />
            </button>
          );
        })}
      </div>

      {summary.rows.length > 0 && (
        <>
          <div class="eq-head" aria-hidden="true">
            <span />
            <span>Appareil</span>
            <span>Puissance</span>
            <span>Utilisation</span>
            <span>Quand</span>
            <span class="num">Par an</span>
            <span />
          </div>
          <ul class="eq-list">
            {summary.rows.map(({ equipment: e, kwh: k, cost }) => {
              const Icon = KIND_ICONS[e.kind];
              return (
                <li class="eq-row" key={e.id}>
                  <span class="eq-icon">
                    <Icon size={20} />
                  </span>
                  <input
                    class="eq-name"
                    value={e.name}
                    maxLength={60}
                    aria-label="Nom de l'appareil"
                    onInput={(ev) => setEquipment(e.id, { name: (ev.currentTarget as HTMLInputElement).value })}
                  />
                  <NumberField
                    class="compact eq-power"
                    label="Puissance"
                    unit="W"
                    max={50000}
                    value={e.power}
                    onChange={(power) => setEquipment(e.id, { power })}
                  />
                  <NumberField
                    class="compact eq-hours"
                    label="Utilisation"
                    unit="h/j"
                    max={24}
                    value={e.hours}
                    onChange={(hours) => setEquipment(e.id, { hours })}
                  />
                  <Segmented
                    label="Moment d'utilisation"
                    size="sm"
                    value={e.timing}
                    options={TIMING_OPTIONS}
                    onChange={(timing) => setEquipment(e.id, { timing })}
                  />
                  <span class="eq-cost num">
                    <strong>{cost !== undefined ? euros(cost) : "—"}</strong>
                    <span>{kwh(k)}</span>
                    <span class="eq-bar" style={{ width: `${(k / maxKwh) * 100}%` }} />
                  </span>
                  <button type="button" class="icon-button" aria-label={`Retirer ${e.name}`} onClick={() => remove(e.id)}>
                    <X size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
          <Stats state={state} summary={summary} tariff={tariff} declaredKwh={declaredKwh} />
        </>
      )}
    </section>
  );
}

function Stats({ state, summary, tariff, declaredKwh }: Omit<Props, "update">) {
  const peakKva = summary.peak / 1000;
  const powers = powersFor(state.offer);
  const enough = powers.find((p) => p >= peakKva);
  const subscription = (p: number) => tariffFor(state.offer, p)?.subscription ?? 0;

  let advice: preact.ComponentChildren;
  if (enough === undefined || enough > state.power) {
    advice = (
      <>
        Au-dessus de vos {state.power} kVA : risque de disjoncter si tout fonctionne en même temps
        {enough !== undefined && <> (passer à {enough} kVA coûterait {euros(subscription(enough) - subscription(state.power))}/an de plus)</>}.
      </>
    );
  } else if (enough < state.power) {
    advice = (
      <>
        {enough} kVA devraient suffire : <strong>{euros(subscription(state.power) - subscription(enough))}/an</strong>{" "}
        d'abonnement en moins.
      </>
    );
  } else {
    advice = <>Vos {state.power} kVA sont bien dimensionnés.</>;
  }

  return (
    <dl class="stats">
      <div>
        <dt>Consommation estimée</dt>
        <dd>
          {integer(summary.totalKwh)} <small>kWh/an</small>
        </dd>
        <p>
          {declaredKwh > 0
            ? `${percent(summary.totalKwh / declaredKwh)} de votre consommation déclarée`
            : "Renseignez votre consommation pour comparer"}
          {tariff && summary.totalCost !== undefined && <> · {euros(summary.totalCost)}/an hors abonnement</>}
        </p>
      </div>
      <div>
        <dt>La nuit</dt>
        <dd>{summary.hcShare !== null ? percent(summary.hcShare) : "—"}</dd>
        <p>de la consommation de vos appareils, en heures creuses</p>
      </div>
      <div>
        <dt>Pointe estimée</dt>
        <dd>{watts(summary.peak)}</dd>
        <p>{advice}</p>
      </div>
    </dl>
  );
}
