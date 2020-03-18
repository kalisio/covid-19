# Données cartographiques concernant l'épidémie de COVID-19

L'information officielle sur la progression de l'épidémie en France est assez fragmentée. Différentes initiatives tentent de structurer celle-ci sous forme de données libres. Malgré ce travail les données sont néanmoins souvent difficilement
exploitables à l'état brut au sein d'outils cartographiques.

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

* données journalières par région consolidées au niveau national dans le dossier [regions-france](./regions-france)
  * issues des données des [Agences Régionales de Santé](https://github.com/opencovid19-fr/data/tree/master/agences-regionales-sante)
  * croisement géographique par région réalisé sur la base du code de région
  * géolocalisation des données au barycentre de la région pour la constitution d'[heatmaps](https://fr.wikipedia.org/wiki/Heat_map)

* données journalières par département consolidées au niveau national dans le dossier [departements-france](./departements-france)
  * issues des données des [Agences Régionales de Santé](https://github.com/opencovid19-fr/data/tree/master/agences-regionales-sante)
  * croisement géographique par département réalisé sur la base du code de département
  * géolocalisation des données au barycentre du département pour la constitution d'[heatmaps](https://fr.wikipedia.org/wiki/Heat_map)

Si vous souhaitez référencer les jeux de données directement plutôt que de les copier utiliser plutôt notre bucket S3 sur AWS, le chemin vers les fichiers reste le même en préfixant par la racine `https://s3.eu-central-1.amazonaws.com/krawler/`. Par exemple l'URL vers le fichier des patients en france est `https://s3.eu-central-1.amazonaws.com/krawler/covid-19/patients-france/patients-france.json`.

![Carte de densité évolutive des cas](Kano-Covid-19-Heatmap-France.gif)

Voir la [vidéo originale](https://drive.google.com/open?id=1G6IWKDE1XuSIjY_ncSELPcl8GuMmmKoH).

* données globales individualisée des patients en France dans le dossier [patients-france](./patients-france)
  * géolocalisation des données au barycentre du département
  * contient une version aggrégée par département pour la constitution d'[heatmaps](https://fr.wikipedia.org/wiki/Heat_map)

<img src="https://raw.githubusercontent.com/kalisio/covid-19/master/patients-france.png" width="512" height="512">

<img src="https://raw.githubusercontent.com/kalisio/covid-19/master/patients-france-zoom.png" width="512" height="512">

<img src="https://raw.githubusercontent.com/kalisio/covid-19/master/patients-heatmap-france.png" width="512" height="512">

## Outils

Les données sont scrappées via [Krawler](https://kalisio.github.io/krawler/) et peuvent être visualisées via [Kano](https://kalisio.github.io/kano/) ou tout autre outil SIG standard comme [geojson.io](http://geojson.io/), [QGIS](https://www.qgis.org/fr/site/), etc.

Nous faisons évoluer nos outils en fonction des besoins, aussi il faut utiliser la version en cours de développement (branche master) et non des version stables. Pour Kano il vous faudra par exemple faire un [yarn/npm link](https://docs.npmjs.com/cli/link) comme tout développeur travaillant sur ce projet.

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

## Examples d'application

L'ensemble des données est visualisable via un simple drag'n'drop des fichiers dans Kano. Néanmoins pour des visualisations spatio-temporelles avancées comme les heatmaps il vous faudra faire un peu de configuration.

Exemple de configuration d'une heatmap:
```js
{
    name: 'COVID-19 (ARS)',
    description: 'Cases in France',
    tags: [
      'business'
    ],
    icon: 'fas fa-atlas',
    attribution: '',
    type: 'OverlayLayer',
    featureId: 'Province/State',
    leaflet: {
      type: 'heatmap',
      urlTemplate: `https://s3.eu-central-1.amazonaws.com/krawler/covid-19/departements-france/departements-france-<%= time.format('YYYY-MM-DD') %>.json`,
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
  }
```

## Comment contribuer ?

Vous pouvez vous proposer comme volontaire pour tester nos scrappeurs, utiliser nos données ou réaliser de nouveaux jeux de données.

Pour vous signaler rejoignez la communauté sur [Slack](https://join.slack.com/t/dataagainstcovid-19/shared_invite/zt-cgsplso2-LIvWeRHlf1ZFIrh~SPj~IA), ouvrez une [issue](https://github.com/kalisio/covid-19/issues) ou une une [pull request](https://github.com/kalisio/covid-19/pulls).

Quelques idées:
* production de jeux de données avec le contour des départements et non les barycentres
* géolocalisation des données des patients au niveau communal (pour l'instant très peu de données)
* consitution de collections MongoDB pour visualisation spatio-temporelle dans Kano (eg séries temporelles)

## Licence

Les données dérivées sont publiées sous la licence des données sources.

Les codes sources sont publiés sous licence MIT.
