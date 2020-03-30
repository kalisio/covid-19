# Données cartographiques concernant l'épidémie de COVID-19

L'information officielle sur la progression de l'épidémie en France est assez fragmentée. Différentes initiatives tentent de structurer celle-ci sous forme de données libres. Malgré ce travail les données sont néanmoins souvent difficilement
exploitables à l'état brut au sein d'outils cartographiques.

L'objectif de ce dépôt est de consolider l'information et de la rendre disponible dans des formats ouverts et aisément réutilisables pour produire des cartes. Le format pivot privilégié est le [GeoJson](https://fr.wikipedia.org/wiki/GeoJSON).

## Comment contribuer ?

Vous pouvez vous proposer comme volontaire pour tester nos scrappeurs, les améliorer, utiliser nos données ou réaliser de nouveaux jeux de données.

Pour vous signaler rejoignez la communauté sur [Slack](https://join.slack.com/t/dataagainstcovid-19/shared_invite/zt-cgsplso2-LIvWeRHlf1ZFIrh~SPj~IA), ouvrez une [issue](https://github.com/kalisio/covid-19/issues) ou une une [pull request](https://github.com/kalisio/covid-19/pulls).

Quelques idées:
* ~~production de jeux de données avec le contour des départements et non les barycentres~~
* ~~croisement avec des données de population~~
* ~~croisement avec des données hospitalières (nombre de lits, etc.)~~ => fait via SAE 2018
* ~~intégrer les [nouvelles données](https://github.com/opencovid19-fr/data/tree/master/data-sources/sante-publique-france) de Santé Publique France remontées au niveau départemental~~
* géolocalisation des données des patients au niveau communal (pour l'instant très peu de données)
* consitution de collections MongoDB pour visualisation spatio-temporelle dans Kano (eg séries temporelles)

## Sources de données

Nos principales sources de données sont les suivantes:
* niveau mondial
  * https://github.com/CSSEGISandData/COVID-19
* niveau national
  * données régionales/départementales https://github.com/opencovid19-fr/data
  * données individualisée https://github.com/lperez31/coronavirus-france-dataset
* croisements géographiques
  * contours administratifs nationaux https://github.com/gregoiredavid/france-geojson
  * population régionale/départementale par classe d'âge https://www.insee.fr/fr/statistiques/1893198
  * correspondance code départements/régions https://www.insee.fr/fr/information/3720946#titre-bloc-15
  * données hospitalières issues de la [statistique annuelle des établissements de santé](https://www.sae-diffusion.sante.gouv.fr/sae-diffusion/recherche.htm) (2018)

Example de requête pour nombre de lits en réanimation sur https://hopitaux.datasette.11d.im/hopitaux:
```
SELECT departement, libdepartement, sum(LIT) AS lits
    FROM(select DISTINCT f.departement, f.libdepartement, r.FI, r.FI_EJ, r.UNI, r.LIT
    FROM [finess-clean] f
    INNER JOIN REA_2018 r
    ON r.FI = f.nofinesset AND r.UNI = 'SITOT') tmp
    GROUP BY departement, libdepartement
```

## Données cartographiques

Chaque élément cartographique peut contenir les propriétés suivantes:
* `Country/Region` Pays/Région de provenance
* `Province/State` Etat/Département de provenance
* `Confirmed` nombre de cas confirmés
* `Deaths` nombre de décès confirmés
* `Recovered` nombre de guérisons confirmées
* `Severe` nombre de cas hospitalisés
* `Critical` nombre de cas en réanimation
* `Population`
  * `Total` - Ensemble
  * `Under19` - 0 à 19 ans
  * `Under39` - 20 à 39 ans
  * `Under59` - 40 à 59 ans
  * `Under74` - 60 à 74 ans
  * `Over75` - 75 ans et plus
* `Beds` Lits hospitaliers
  * `Total` - Ensemble
  * `Resuscitation` - Réanimation
  * `IntensiveCare` - Soins intensifs

Les principales données produites sont les suivantes:

* données journalières par région consolidées au niveau national :open_file_folder: [regions-france](./regions-france)
  * issues des données des [Agences Régionales de Santé](https://github.com/opencovid19-fr/data/tree/master/agences-regionales-sante) et de [Santé Publique France](https://github.com/opencovid19-fr/data/tree/master/sante-publique-france)
  * croisement géographique par région réalisé sur la base du code de région
  * polygones (fichiers préfixés par `polygons`) ou géolocalisation des données au barycentre de la région pour la constitution d'[heatmaps](https://fr.wikipedia.org/wiki/Heat_map)

Carte évolutive des cas en régions, taille des bulles liée au nombre de cas:
![Carte évolutive des cas en régions](Kano-Covid-19-Regions-France.gif)

Voir la [vidéo originale](https://drive.google.com/file/d/1GjdhBEVwtei5WxCTeXwtoKquKUQk5Gwp/view).

Carte évolutive des cas en régions, taille des bulles liée au nombre de cas pondéré par la population:
![Carte évolutive des cas en régions pondérés selon la population](Kano-Covid-19-Regions-France-Population.gif)

Voir la [vidéo originale](https://drive.google.com/file/d/1PpuVcfr6CGq48rGWr5xq9aMCsq7XTPQX/view).

Carte évolutive des cas en régions, taille des bulles liée au nombre de cas pondéré par la population, couleur/opacité des bulles liée au rapport entre le nombre de cas et de lits disponibles (on suppose que 10% des cas occupent des lits):
![Carte évolutive des cas en régions pondérés selon la population et les lits disponibles](Kano-Covid-19-Regions-France-Population-Lits.gif)

Voir la [vidéo originale](https://drive.google.com/file/d/1tcD_34txCr8I-5L_EVor-sQPO4xm_YQh/view).

* données journalières par département consolidées au niveau national :open_file_folder: [departements-france](./departements-france)
  * issues des données des [Agences Régionales de Santé](https://github.com/opencovid19-fr/data/tree/master/agences-regionales-sante)
  * croisement géographique par département réalisé sur la base du code de département
  * polygones (fichiers préfixés par `polygons`) ou géolocalisation des données au barycentre du département pour la constitution d'[heatmaps](https://fr.wikipedia.org/wiki/Heat_map)

Carte de densité évolutive des cas par département:
![Carte de densité évolutive des cas](Kano-Covid-19-Heatmap-France.gif)

Voir la [vidéo originale](https://drive.google.com/open?id=1G6IWKDE1XuSIjY_ncSELPcl8GuMmmKoH).

* données globales individualisée des patients en France :open_file_folder: [patients-france](./patients-france)
  * géolocalisation des données au barycentre du département
  * contient une version aggrégée par département pour la constitution d'[heatmaps](https://fr.wikipedia.org/wiki/Heat_map)

Carte des cas par département:

<img src="https://raw.githubusercontent.com/kalisio/covid-19/master/patients-france.png" width="512" height="512">

<img src="https://raw.githubusercontent.com/kalisio/covid-19/master/patients-france-zoom.png" width="512" height="512">

Carte de densité des cas par département:

<img src="https://raw.githubusercontent.com/kalisio/covid-19/master/patients-heatmap-france.png" width="512" height="512">

Si vous souhaitez référencer les jeux de données directement plutôt que de les copier utiliser plutôt notre bucket S3 sur AWS, le chemin vers les fichiers reste le même en préfixant par la racine `https://s3.eu-central-1.amazonaws.com/krawler/`. Par exemple l'URL vers le fichier des patients en france est `https://s3.eu-central-1.amazonaws.com/krawler/covid-19/patients-france/patients-france.json`.

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
krawler france-patients-jobfile.js --departements
krawler france-departements-jobfile.js --date 2020-03-01 --geometry 'Point' ou 'Polygon'
...
krawler france-departements-jobfile.js --date 2020-03-16 --geometry 'Point' ou 'Polygon'
krawler france-regions-jobfile.js --date 2020-03-01 --geometry 'Point' ou 'Polygon'
...
krawler france-regions-jobfile.js --date 2020-03-16 --geometry 'Point' ou 'Polygon'
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

Exemple de configuration d'un affichage de bulles d'information par région:
```js
{
  name: 'COVID-19 (Regions)',
  description: 'Cases by regions in France',
  tags: [ 'business' ],
  icon: 'fas fa-atlas',
  attribution: '',
  type: 'OverlayLayer',
  featureId: 'Province/State',
  leaflet: {
    type: 'geoJson',
    realtime: true,
    sourceTemplate: `https://s3.eu-central-1.amazonaws.com/krawler/covid-19/regions-france/regions-france-<%= time.format('YYYY-MM-DD') %>.json`,
    'marker-type': 'circleMarker',
    radius: `<%= 10 + Math.round(properties.Confirmed * 0.02) %>`,
    stroke: 'red',
    'stroke-opacity': 1,
    'fill-opacity': 0.5,
    'fill-color': 'green',
    template: ['radius'],
    tooltip: {
      template: `<b><%= properties['Province/State'] %></br><% if (properties.Confirmed) { %> <%= properties.Confirmed %> cas<% }
                 if (properties.Deaths) { %> - <%= properties.Deaths %> décès<% } %></b>`
    }
  }
}
```

Exemple de configuration d'un affichage coloré dépendant du ration de cas/lits par région:
```js
{
  name: 'COVID-19 (Regions)',
  description: 'Cases by regions in France',
  tags: [ 'business' ],
  icon: 'fas fa-atlas',
  attribution: '',
  type: 'OverlayLayer',
  featureId: 'Province/State',
  leaflet: {
    type: 'geoJson',
    realtime: true,
    sourceTemplate: `https://s3.eu-central-1.amazonaws.com/krawler/covid-19/regions-france/regions-france-<%= time.format('YYYY-MM-DD') %>.json`,
    'marker-type': 'circleMarker',
    radius: `<%= 10 + Math.round(properties.Confirmed * 0.02) %>`,
    stroke: 'red',
    'stroke-opacity': 1,
    'fill-opacity': '<%= 0.5 + (0.1 * properties.Confirmed / properties.Beds.Total) %>',
    'fill-color': '<%= chroma.scale('BuPu').domain([-1,1])(0.1 * properties.Confirmed / properties.Beds.Total).hex() %>',
    template: ['radius', 'fill-color', 'fill-opacity'],
    tooltip: {
      template: `<b><%= properties['Province/State'] %></br><% if (properties.Confirmed) { %> <%= properties.Confirmed %> cas<% }
                 if (properties.Deaths) { %> - <%= properties.Beds.Total %> lits<% } %></b>`
    }
  }
}
```

Exemple de configuration d'une heatmap:
```js
{
  name: 'COVID-19 (Depts)',
  description: 'Cases by departements in France',
  tags: [ 'business' ],
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

## Licence

Les données dérivées sont publiées sous la licence des données sources.

Les codes sources sont publiés sous licence MIT.
