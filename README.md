# GoConso

**GoConso** helps you **understand** your electrical consumption and pick the cheapest regulated EDF option.

It runs entirely in the browser and is published on GitHub Pages: https://fallais.github.io/goconso/

- Compares **Base**, **Heures creuses** and **Tempo** from your yearly consumption, whatever your current option.
- Shows the off-peak share above which Heures creuses beats Base, and lets you tune the Tempo assumptions.
- Estimates the yearly cost of each appliance, the share used at night and whether your subscribed power fits.
- Share a simulation with a link. Inputs are kept in the browser's local storage, nothing is sent anywhere.

## Configuration file

You can fill the form directly, or import a `ma_conso.yml` file:

```yml
# Option (base, heures_creuses ou tempo)
option: "heures_creuses"

# Puissance (en kVA)
puissance: 9

# Consommation sur 12 mois (en kWh)
index:
  heures_creuses: 1900
  heures_pleines: 2800
```

Use `total` for the `base` option, and `bleu_hc`, `bleu_hp`, `blanc_hc`, `blanc_hp`, `rouge_hc`, `rouge_hp` for `tempo`.

## Development

```sh
npm install
npm run dev     # local server
npm test        # unit tests
npm run build   # production build in dist/
```

Built with Vite, TypeScript and Preact.

## Tariffs

Tariffs come from the [CRE open data](https://www.data.gouv.fr/datasets/historique-des-tarifs-reglementes-de-vente-delectricite-pour-les-consommateurs-residentiels) and are stored in `src/edf/*Tariffs.ts`. Run `npm run update-tariffs` to refresh them.

The `Update tariffs` workflow does it monthly and opens a pull request when they change. It requires **Settings > Actions > General > Allow GitHub Actions to create and approve pull requests**.

## Deployment

Every push on `main` is built and deployed to GitHub Pages by `.github/workflows/pages.yml`.
