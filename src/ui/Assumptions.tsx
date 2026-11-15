import { hphcBreakEven, type Profile } from "../simulation";
import { DEFAULT_TEMPO_SHARES, type State } from "../state";
import { SectionTitle } from "./controls";
import { percent } from "./format";

interface Props {
  state: State;
  update: (fn: (s: State) => State) => void;
  profile: Profile;
  equipmentHcShare: number | null;
}

interface RangeProps {
  label: string;
  value: number; // 0..1
  max?: number;
  disabled?: boolean;
  marker?: number | null;
  markerLabel?: string;
  onChange?: (value: number) => void;
}

function Range({ label, value, max = 1, disabled, marker, markerLabel, onChange }: RangeProps) {
  const pos = (v: number) => `${(Math.min(max, Math.max(0, v)) / max) * 100}%`;
  return (
    <div class={`range ${disabled ? "disabled" : ""}`}>
      <div class="range-head">
        <span>{label}</span>
        <output>{percent(value)}</output>
      </div>
      <div class="range-track">
        {marker != null && marker > 0 && marker < max && (
          <span class="range-marker" style={{ left: pos(marker) }}>
            <span>{markerLabel}</span>
          </span>
        )}
        <input
          type="range"
          min={0}
          max={max * 100}
          step={1}
          value={Math.round(value * 100)}
          disabled={disabled}
          aria-label={label}
          style={{ "--fill": pos(value) }}
          onInput={(e) => onChange?.((e.currentTarget as HTMLInputElement).valueAsNumber / 100)}
        />
      </div>
    </div>
  );
}

export function Assumptions({ state, update, profile, equipmentHcShare }: Props) {
  const breakEven = hphcBreakEven(state.power, profile.total);
  const hcEditable = state.offer === "base";
  const tempoEditable = state.offer !== "tempo";
  const setTempo = (patch: Partial<State["tempoShares"]>) =>
    update((s) => ({ ...s, tempoShares: { ...s.tempoShares, ...patch } }));

  let verdict: string;
  if (breakEven === null) verdict = "Base et Heures creuses ne sont pas comparables à cette puissance.";
  else if (breakEven <= 0) verdict = "Les heures creuses sont plus avantageuses quelle que soit votre répartition.";
  else if (breakEven >= 1) verdict = "La Base reste plus avantageuse, même avec toute la consommation en heures creuses.";
  else
    verdict = `Les heures creuses deviennent rentables au-delà de ${percent(breakEven)} de consommation en heures creuses.`;

  const isDefaultTempo =
    Math.round(state.tempoShares.white * 100) === Math.round(DEFAULT_TEMPO_SHARES.white * 100) &&
    Math.round(state.tempoShares.red * 100) === Math.round(DEFAULT_TEMPO_SHARES.red * 100);

  return (
    <section class="panel assumptions" aria-labelledby="assumptions-title">
      <SectionTitle index="02">
        <span id="assumptions-title">Hypothèses</span>
      </SectionTitle>

      <div class="assumption">
        <h3>Consommation la nuit</h3>
        <Range
          label="Part en heures creuses"
          value={profile.hcShare}
          disabled={!hcEditable}
          marker={breakEven}
          markerLabel="seuil"
          onChange={(hcShare) => update((s) => ({ ...s, hcShare }))}
        />
        <p class="note">{verdict}</p>
        {hcEditable ? (
          equipmentHcShare !== null &&
          Math.round(equipmentHcShare * 100) !== Math.round(state.hcShare * 100) && (
            <button
              type="button"
              class="link"
              onClick={() => update((s) => ({ ...s, hcShare: equipmentHcShare }))}
            >
              Utiliser l'estimation de vos appareils ({percent(equipmentHcShare)})
            </button>
          )
        ) : (
          <p class="hint">Mesurée à partir de vos index.</p>
        )}
      </div>

      <div class="assumption">
        <h3>Jours Tempo</h3>
        <Range
          label="Consommation en jours blancs"
          value={profile.colorShares.white}
          max={0.4}
          disabled={!tempoEditable}
          onChange={(white) => setTempo({ white: Math.min(white, 1 - state.tempoShares.red) })}
        />
        <Range
          label="Consommation en jours rouges"
          value={profile.colorShares.red}
          max={0.4}
          disabled={!tempoEditable}
          onChange={(red) => setTempo({ red: Math.min(red, 1 - state.tempoShares.white) })}
        />
        {tempoEditable ? (
          <p class="hint">
            43 jours blancs et 22 jours rouges par an, en hiver. Augmentez ces parts si vous vous chauffez à
            l'électricité.{" "}
            {!isDefaultTempo && (
              <button type="button" class="link" onClick={() => setTempo({ ...DEFAULT_TEMPO_SHARES })}>
                Réinitialiser
              </button>
            )}
          </p>
        ) : (
          <p class="hint">Mesurée à partir de vos index Tempo.</p>
        )}
      </div>
    </section>
  );
}
