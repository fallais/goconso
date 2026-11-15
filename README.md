# GoConso

**GoConso** helps you **understand** your electrical consumption and **optimize** it.

It runs entirely in the browser and is published on GitHub Pages: https://fallais.github.io/goconso/

- Compare your current EDF option (`Base` or `Heures creuses`) using your meter indexes.
- List your equipments and see whether they mostly run during the day or the night.
- Your inputs are kept in the browser's local storage, nothing is sent anywhere.

## Configuration file

You can fill the form directly, or import an existing `ma_conso.yml`:

```yml
# Option (base ou heures_creuses)
option: "heures_creuses"

# Puissance (en KVA)
puissance: 9

# Index
index:
  heures_creuses: 1900
  heures_pleines: 2800
```

or

```yml
option: "base"
puissance: 6
index:
  total: 4700
```

## Development

```sh
npm install
npm run dev     # local server
npm test        # unit tests
npm run build   # production build in dist/
```

Tariffs come from the [CRE open data](https://www.data.gouv.fr/datasets/historique-des-tarifs-reglementes-de-vente-delectricite-pour-les-consommateurs-residentiels) and are stored in `src/edf/baseTariffs.ts` and `src/edf/offpeakTariffs.ts`. Run `npm run update-tariffs` to refresh them.

## Deployment

Every push on `main` is built and deployed by `.github/workflows/pages.yml`.
In the repository settings, set **Pages > Source** to **GitHub Actions**.
