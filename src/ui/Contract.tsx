import { OFFER_LABELS, OFFERS, TEMPO_COLORS, TEMPO_LABELS, powersFor } from "../edf/offers";
import type { State } from "../state";
import { NumberField, SectionTitle, Segmented } from "./controls";

interface Props {
  state: State;
  update: (fn: (s: State) => State) => void;
}

export function Contract({ state, update }: Props) {
  const { offer, power, readings } = state;
  const setReadings = (patch: Partial<State["readings"]>) =>
    update((s) => ({ ...s, readings: { ...s.readings, ...patch } }));

  return (
    <section class="panel contract" aria-labelledby="contract-title">
      <SectionTitle index="01">
        <span id="contract-title">Votre contrat</span>
      </SectionTitle>

      <div class="stack">
        <div class="control">
          <span class="control-label">Option actuelle</span>
          <Segmented
            label="Option actuelle"
            value={offer}
            options={OFFERS.map((o) => ({ value: o, label: OFFER_LABELS[o] }))}
            onChange={(o) => update((s) => ({ ...s, offer: o }))}
          />
        </div>

        <div class="control">
          <span class="control-label">Puissance souscrite</span>
          <Segmented
            label="Puissance souscrite"
            size="sm"
            value={power}
            options={powersFor(offer).map((p) => ({ value: p, label: `${p}`, title: `${p} kVA` }))}
            onChange={(p) => update((s) => ({ ...s, power: p }))}
          />
          <span class="control-suffix">kVA</span>
        </div>

        <div class="control">
          <span class="control-label">Consommation sur 12 mois</span>
          {offer === "base" && (
            <div class="readings">
              <NumberField label="Total" unit="kWh" value={readings.total} onChange={(total) => setReadings({ total })} />
            </div>
          )}
          {offer === "hphc" && (
            <div class="readings two">
              <NumberField label="Heures creuses" unit="kWh" value={readings.hc} onChange={(hc) => setReadings({ hc })} />
              <NumberField label="Heures pleines" unit="kWh" value={readings.hp} onChange={(hp) => setReadings({ hp })} />
            </div>
          )}
          {offer === "tempo" && (
            <div class="readings tempo">
              {TEMPO_COLORS.map((c) => (
                <div class={`tempo-row ${c}`} key={c}>
                  <span class="tempo-chip">{TEMPO_LABELS[c]}</span>
                  {(["hc", "hp"] as const).map((k) => (
                    <NumberField
                      key={k}
                      label={k === "hc" ? "Heures creuses" : "Heures pleines"}
                      unit="kWh"
                      value={readings.tempo[c][k]}
                      onChange={(v) =>
                        setReadings({ tempo: { ...readings.tempo, [c]: { ...readings.tempo[c], [k]: v } } })
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
          <p class="hint">Indiquée sur votre facture annuelle ou dans votre espace client.</p>
        </div>
      </div>
    </section>
  );
}
