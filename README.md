# Données cartographiques concernant l'épidémie de COVID-19

L'information officielle sur la progression de l'épidémie en France est assez fragmentée. Différentes initiatives tentent de structurer celle-ci sous forme de données libres. Malgré ce travail déjà les données sont néanmoins souvent difficilement
exploitables à l'état brut au sein d'outils cartographique.

L'objectif de ce dépôt est de consolider l'information et de la rendre disponible dans des formats ouverts et aisément réutilisables pour produire des cartes. Le format pivot privilégié est le [GeoJson](https://fr.wikipedia.org/wiki/GeoJSON).

## Sources de données

Nos principales sources de données sont les suivantes:
* niveau mondial
  * https://github.com/CSSEGISandData/COVID-19
* niveau national
 * données régionales/départementales https://github.com/opencovid19-fr/data
 * données individualisée https://github.com/lperez31/coronavirus-france-dataset
* croisements géographiques
  * données nationales https://github.com/gregoiredavid/france-geojson

## Données cartographiques

Les données du Johns Hopkins CSSE étant devenu le standard defacto nous avons décidé de conserver leur format pour l'essentiel des jeux de données produits, c'est à dire que chaque élément cartographique contient les propriétés suivantes:
* `Country/Region` Pays/Région de provenance
* `Province/State` Etat/Département de provenance
* `Confirmed` nombre de cas confirmés
* `Deaths` nombre de décès confirmés
* `Recovered` nombre de guérisons confirmées

Les principales données produites sont les suivantes:
* données journalières par département consolidées au niveau national [departements-france](./departements-france)
  * issues des données des [Agences Régionales de Santé](https://github.com/opencovid19-fr/data/tree/master/agences-regionales-sante)
  * croisement géographique par département réalisé sur la base du code de département
  * géolocalisation des données au barycentre du département pour la constitution d'[heatmaps](https://fr.wikipedia.org/wiki/Heat_map)

![Carte de densité évolutive des cas](Kano-Covid-19-Heatmap-France.gif)

Voir la [vidéo originale](https://drive.google.com/open?id=1G6IWKDE1XuSIjY_ncSELPcl8GuMmmKoH).

* données globales individualisée des patients en France [patients-france](./patients-france)
  * géolocalisation des données au barycentre du département
  * contient une version aggrégée par département pour la constitution d'[heatmaps](https://fr.wikipedia.org/wiki/Heat_map)

![Distribution des patients](./patients-france.png)

![Distribution des patients (zoom)](./patients-france-zoom.png)

![Carte de densité des patients](./patients-heatmap-france.png)

## Examples d'application

L'ensemble des données est visualisable via un simple drag'n'drop des fichiers dans Kano. Néanmoins pour des visualisations spatio-temporelles avancées il vous faudra faire un peu de configuration.

Exemple de configuration d'une heatmap:
```js
{
    name: 'COVID-19 (Patients)',
    description: 'Patients in France',
    tags: [
      'business'
    ],
    icon: 'fas fa-procedures',
    type: 'OverlayLayer',
    leaflet: {
      type: 'heatmap',
      url: `${s3Url}/krawler/covid-19/patients-heatmap-france.json`,
      valueField: 'Confirmed',
      // The unit is in pixel, meaning
      // 1 pixel radius (2 pixel diameter) at zoom level 0
      // ...
      // 64 pixel radius (128 pixel diameter) at zoom level 6
      // ...
      // We'd like an event to cover a range expressed as Km
      // According to https://groups.google.com/forum/#!topic/google-maps-js-api-v3/hDRO4oHVSeM
      // this means 1 pixel at level 7 so at level 0 we get 1 / 2^7
      radius: 100 * 0.0078,
      minOpacity: 0,
      maxOpacity: 0.5,
      // scales the radius based on map zoom
      scaleRadius: true,
      // uses the data maximum within the current map boundaries
      // (there will always be a red spot with useLocalExtremas true)
      useLocalExtrema: false,
      min: 0,
      max: 100,
      // The higher the blur factor is, the smoother the gradients will be
      blur: 0.8
    }
```

## Outils

Les données sont scrappées via [Krawler](https://kalisio.github.io/krawler/). Les données sont visualisée via [Kano](https://kalisio.github.io/kano/).

Nous faisons évoluer ces outils en fonction des besoins, aussi il faut utiliser la version en cours de développement (branche master) et non des version stables. Pour Kano il vous faudra par exemple faire un [yarn/npm link](https://docs.npmjs.com/cli/link).

Pour Krawler:
```bash
// Clone and install krawler
git clone https://github.com/kalisio/krawler.git
cd krawler
yarn install
yarn link

// Clone and run a job
git clone https://github.com/kalisio/covid-19.git
cd covid-19
export NODE_PATH="path_to_krawler/node_modules"
krawler france-patients-jobfile.js
krawler france-patients-jobfile.js 'heatmap'
krawler france-jobfile.js 2020-03-01
krawler france-jobfile.js 2020-03-02
...
krawler france-jobfile.js 2020-03-16
```

Pour Kano:
```bash
// Clone and link the development kit
git clone https://github.com/kalisio/kdk.git
cd kdk
yarn install
yarn link
yarn run watch

// Clone and run the app
git clone https://github.com/kalisio/kano.git

// In one terminal run the backend
cd kano/api
yarn install
yarn link @kalisio/kdk
yarn run dev

// In another terminal run the frontend
cd kano
yarn install
yarn link @kalisio/kdk
yarn run dev
```

## Comment contribuer ?

Vous pouvez vous proposer comme volontaire pour tester nos scrappeur, utiliser nos données ou réaliser de nouveaux jeux de données.

Quelques idées:
* géolocalisation des données des patients au niveau communal
* consitution de collections MongoDB pour visualisation spatio-temporelle dans Kano

## Licence

Les données dérivées sont publiées sous la licence des données sources.

Les codes sources sont publiés sous licence MIT.
