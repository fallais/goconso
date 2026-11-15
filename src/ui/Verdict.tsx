import { OFFER_LABELS, type OfferId } from "../edf/offers";
import type { OfferResult, Profile } from "../simulation";
import { euros, eurosCents, integer, kwh, percent, unitPrice } from "./format";

interface Props {
  offer: OfferId;
  results: OfferResult[];
  profile: Profile;
  power: number;
}

export function Verdict({ offer, results, profile, power }: Props) {
  const available = results.filter((r) => r.cost).sort((a, b) => a.cost!.total - b.cost!.total);
  const current = results.find((r) => r.offer === offer)?.cost;
  const best = available[0];

  if (!current || !best || profile.total <= 0) {
    return (
      <section class="panel verdict" aria-live="polite">
        <p class="kicker">Verdict</p>
        <p class="headline">Renseignez votre consommation pour comparer les options.</p>
      </section>
    );
  }

  const max = Math.max(...available.map((r) => r.cost!.total));
  const isBest = best.offer === offer;
  const runnerUp = available.find((r) => r.offer !== offer);
  const saving = current.total - best.cost!.total;

  return (
    <section class="panel verdict" aria-live="polite" aria-labelledby="verdict-title">
      {isBest ? (
        <>
          <p class="kicker">Verdict · {OFFER_LABELS[offer]} {power} kVA</p>
          <h2 class="headline" id="verdict-title">
            Vous êtes déjà sur l'option <mark>la moins chère</mark>.
          </h2>
          {runnerUp && (
            <p class="sub">
              {OFFER_LABELS[runnerUp.offer]} vous coûterait <strong>{euros(runnerUp.cost!.total - current.total)}</strong>{" "}
              de plus par an.
            </p>
          )}
        </>
      ) : (
        <>
          <p class="kicker">Verdict · {OFFER_LABELS[offer]} {power} kVA</p>
          <h2 class="headline" id="verdict-title">
            <span class="big">
              <mark>{euros(saving)}</mark>
              <small>/an</small>
            </span>
            d'économie en passant à l'option {OFFER_LABELS[best.offer]}.
          </h2>
        </>
      )}

      <ul class="bars" aria-label="Coût annuel par option">
        {results.map(({ offer: o, cost }) => (
          <li key={o} class={`bar-row ${o === best.offer ? "best" : ""} ${o === offer ? "current" : ""}`}>
            <span class="bar-name">
              {OFFER_LABELS[o]}
              {o === offer && <em>actuelle</em>}
            </span>
            {cost ? (
              <>
                <span class="bar-track" aria-hidden="true">
                  <span class="bar-fill" style={{ width: `${(cost.total / max) * 100}%` }}>
                    <span class="bar-sub" style={{ width: `${(cost.subscription / cost.total) * 100}%` }} />
                  </span>
                </span>
                <span class="bar-value">
                  {euros(cost.total)}
                  {o !== offer && (
                    <small class={cost.total < current.total ? "cheaper" : ""}>
                      {cost.total < current.total ? "−" : "+"}
                      {euros(Math.abs(cost.total - current.total))}
                    </small>
                  )}
                </span>
              </>
            ) : (
              <span class="bar-na">Non proposée en {power} kVA</span>
            )}
          </li>
        ))}
      </ul>
      <p class="legend">
        <span class="swatch sub" /> abonnement <span class="swatch energy" /> consommation · TTC, par an
      </p>

      <details class="breakdown">
        <summary>Détail du calcul</summary>
        <div class="breakdown-grid">
          {available.map(({ offer: o, cost }) => (
            <table key={o}>
              <caption>
                {OFFER_LABELS[o]} <span>tarif du {cost!.tariff.since}</span>
              </caption>
              <tbody>
                <tr>
                  <th>Abonnement</th>
                  <td />
                  <td>{eurosCents(cost!.subscription)}</td>
                </tr>
                {cost!.lines.map((l) => (
                  <tr key={l.label}>
                    <th>{l.label}</th>
                    <td>
                      {integer(l.kwh)} × {unitPrice(l.unitPrice)}
                    </td>
                    <td>{eurosCents(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th>
                  <td>{kwh(profile.total)}</td>
                  <td>{eurosCents(cost!.total)}</td>
                </tr>
              </tfoot>
            </table>
          ))}
        </div>
        <p class="hint">
          Heures creuses : {percent(profile.hcShare)} de la consommation
          {profile.tempo ? "." : ` · Tempo : ${percent(profile.colorShares.white)} en jours blancs, ${percent(profile.colorShares.red)} en jours rouges.`}
        </p>
      </details>
    </section>
  );
}
