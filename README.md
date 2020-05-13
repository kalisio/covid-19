# Données cartographiques concernant l'épidémie de COVID-19

L'information officielle sur la progression de l'épidémie en France a été au départ assez fragmentée. Différentes initiatives ont tenté de structurer celle-ci sous forme de données libres. Malgré ce travail les données ont été néanmoins souvent difficilement exploitables à l'état brut au sein d'outils cartographiques.

L'objectif de ce dépôt est de consolider l'information et de la rendre disponible dans des formats ouverts et aisément réutilisables pour produire des cartes. Le format pivot privilégié est le [GeoJson](https://fr.wikipedia.org/wiki/GeoJSON). Retrouvez également nos données sur [le portail national des données libres](https://www.data.gouv.fr/fr/datasets/donnees-cartographiques-concernant-lepidemie-de-covid-19/).

L'information officielle sur la progression de l’épidémie en France est consolidée par <a href='https://www.santepubliquefrance.fr'>Santé publique France</a>. L’agence propose un <a href='https://www.santepubliquefrance.fr/maladies-et-traumatismes/maladies-et-infections-respiratoires/infection-a-coronavirus/articles/infection-au-nouveau-coronavirus-sars-cov-2-covid-19-france-et-monde'>point épidémiologique quotidien</a>, qui comprend les chiffres-clés nationaux. Par ailleurs, les <a href="https://www.ars.sante.fr">Agences Régionales de Santé</a>, les <a href="http://www.prefectures-regions.gouv.fr">préfectures de régions</a> et les <a href="https://www.interieur.gouv.fr/Le-ministere/Prefectures">préfectures</a> publient des bulletins d’informations centrés sur leur territoire de compétence.

Sous l'impulsion des initiatives libres telles que <a href='https://github.com/opencovid19-fr'>OpenCovid19</a>, Santé publique France propose également des <a href='https://www.data.gouv.fr/fr/organizations/sante-publique-france/'>données relatives à l’épidémie plus précises</a> sur la plateforme <a href='https://www.data.gouv.fr'>www.data.gouv.fr</a>. Un outil <a href='https://github.com/etalab/covid19-dashboard'>dont le code source est libre</a>, développé sous l’impulsion d’<a target='_top' href='https://www.etalab.gouv.fr'>Etalab</a>, au sein de la <a href='https://www.numerique.gouv.fr/dinum/'>direction interministérielle du numérique</a>, propose une vision consolidée des données officielles disponibles.

**A partir du 25/03 devant l'ampleur de la contamination l'indicateur des cas confirmés n'étant plus pertinent il n'est généralement plus communiqué par les pouvoirs publics, sauf au niveau national.**

## Comment contribuer ?

Vous pouvez vous proposer comme volontaire pour tester nos scrappeurs, les améliorer, utiliser nos données ou réaliser de nouveaux jeux de données.

Pour vous signaler rejoignez la communauté sur [Slack](https://join.slack.com/t/dataagainstcovid-19/shared_invite/zt-cgsplso2-LIvWeRHlf1ZFIrh~SPj~IA), ouvrez une [issue](https://github.com/kalisio/covid-19/issues) ou une une [pull request](https://github.com/kalisio/covid-19/pulls).

Quelques idées:
* ~~production de jeux de données avec le contour des départements et non les barycentres~~
* ~~croisement avec des données de population~~
* ~~croisement avec des données hospitalières (nombre de lits, etc.)~~ => fait via SAE 2018
* ~~intégrer les [données hospitalières](https://www.data.gouv.fr/fr/datasets/donnees-hospitalieres-relatives-a-lepidemie-de-covid-19/) de Santé Publique France remontées au niveau départemental~~
* ~~intégrer les [données des urgences et SOS médecins](https://www.data.gouv.fr/fr/datasets/donnees-des-urgences-hospitalieres-et-de-sos-medecins-relatives-a-lepidemie-de-covid-19/) de Santé Publique France remontées au niveau départemental~~
* géolocalisation des données des patients au niveau communal (pour l'instant très peu de données)
* consitution de collections MongoDB pour visualisation spatio-temporelle dans Kano (eg séries temporelles)

## Sources de données

Nos principales sources de données sont les suivantes:
* niveau mondial
  * https://github.com/CSSEGISandData/COVID-19
* niveau national
  * données régionales/départementales https://github.com/opencovid19-fr/data
  * données départementales https://www.data.gouv.fr/fr/organizations/sante-publique-france
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
* `Confirmed` nombre cumulé de cas confirmés
* `Deaths` nombre cumulé de décès
* `Recovered` nombre cumulé de guérisons
* `Severe` nombre de cas hospitalisés à date
* `Critical` nombre de cas en réanimation à date
* `Emergencies`
  * `Total` - nombre de passages quotidiens aux urgences total
  * `Suspected` - nombre de passages quotidiens aux urgences pour suspicion COVID-19
  * `Severe` - nombre d'hospitalisations parmi les passages quotidiens aux urgences pour suspicion COVID-19
* `MedicalActs`
  * `Total` - nombres d'actes médicaux quotidiens SOS Médecins total
  * `Suspected` - nombres d'actes médicaux quotidiens SOS Médecins pour suspicion de COVID-19
* `MedicalTests`
  * `Total` - nombres de tests quotidiens effectués dans un laboratoire d'analyse médicale
  * `Confirmed` - nombres de tests quotidiens positifs dans un laboratoire d'analyse médicale
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
  * `IntensiveCare` - Soins intensifs et continus

Pour chaque indicateur quotidien un indicateur cumulé est automatiquement calculé à partir des valeurs du jour précédent, par exemple il existe une propriété `Emergencies.Suspected/Accumulated` correspondant à la propriété `Emergencies.Suspected`.

Les principales données produites sont les suivantes:

* données journalières par pays au niveau mondial :open_file_folder: [csse_covid_19_daily_reports](./csse_covid_19_daily_reports)
  * issues des données du [Johns Hopkins CSSE](https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_daily_reports)

* données journalières par région consolidées au niveau national :open_file_folder: [regions-france](./regions-france)
  * issues des données des [Agences Régionales de Santé](https://github.com/opencovid19-fr/data/tree/master/agences-regionales-sante) et de [Santé Publique France](https://www.data.gouv.fr/fr/organizations/sante-publique-france/)
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

Carte évolutive des cas hospitalisations en régions, hauteur et couleur des formes 3D liées au nombre de cas sévères pondéré par la population:

![Carte évolutive des cas en régions pondérés selon la population](Kano-Covid-19-Régions-France-Hospitalisations-Population-3D.gif)

Voir la [vidéo originale](https://drive.google.com/file/d/1uNqU9opcMAPYbmaeZWa-aDtfwMw3_kSI/view).

* données journalières par département consolidées au niveau national :open_file_folder: [departements-france](./departements-france)
  * issues des données des [Agences Régionales de Santé](https://github.com/opencovid19-fr/data/tree/master/agences-regionales-sante) et de [Santé Publique France](https://www.data.gouv.fr/fr/organizations/sante-publique-france/)
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

## Génération des jeux données

Les données sont scrappées via [Krawler](https://kalisio.github.io/krawler/) et peuvent être visualisées via [Kano](https://kalisio.github.io/kano/) ou tout autre outil SIG standard comme [geojson.io](http://geojson.io/), [QGIS](https://www.qgis.org/fr/site/), etc.

Les données disponibles ne sont réellement significatives qu'à partir du 1er Mars 2020. Un job Krawler est responsable de la production de chaque jeu de données à une date fixée (i.e. statistiques par département, statistiques par région, patients). Certains jobs sont interdépendants, par exemple les jobs des statistiques par département/région dépendent de l'exécution préalable du job de génération des données hospitalières/urgences Santé Publique France. Le job `generate-data-jobfile` permet de lancer tous les jobs dans le bon ordre pour générer tous les jeux de données sur une période.

**Lorsque certains indicateurs (e.g. les des cas confirmés) manquent à une date donnée nous avons fait le choix de combler le trou en réutilisant la valeur de la date précédente. Merci de tenir compte de cette hypothèse dans vos réutilisation.**

**Certains indicateurs (e.g. les des cas confirmés) peuvent ne plus être pertinents à partir d'une certaine période et donc ne plus être communiqués par les pouvoirs publics, sauf par exemple au niveau national.**

Concernant la géométrie des contours administratifs nous utilisons [mapshaper](https://github.com/mbloch/mapshaper) afin de les simplifier à une précision donnée via la commande suivante:
`mapshaper -i .\departements-france-outre-mer.geojson -simplify keep-shapes interval=500 -o .\departements-france-outre-mer-500m.geojson format=geojson`

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
// Run job to generate all data for all dates in a period
// By default will start on 2020-03-01 and finish on yesterday
krawler generate-data-jobfile.js --start 2020-03-01 --end 2020-03-30
```

Vous pouvez aussi lancer chaque job de façon individuelle:
```bash
// Run job to generate SPF data (to be done first)
krawler spf-donnees-hospitalieres-jobfile.js --date 2020-03-01
// Run job to generate departements data
krawler france-departements-jobfile.js --date 2020-03-01 --geometry 'Point' ou 'Polygon'
...
krawler france-departements-jobfile.js --date 2020-03-16 --geometry 'Point' ou 'Polygon'
// Run job to generate regions data
krawler france-regions-jobfile.js --date 2020-03-01 --geometry 'Point' ou 'Polygon'
...
krawler france-regions-jobfile.js --date 2020-03-16 --geometry 'Point' ou 'Polygon'
// Run job to generate patients data
krawler france-patients-jobfile.js
krawler france-patients-jobfile.js --departements
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

Vous retrouverez dans le fichier :open_file_folder: [kano/covid19-layers.js](./kano/covid19-layers.js) des exemples de configuration d'un affichage de bulles d'information par région, d'un affichage coloré dépendant du ratio de cas/lits, d'une heatmap ou encore d'un affichage 3D coloré et extrudé dépendant du ratio de cas sévères/population par région. Ce fichier est à copier dans le dossier :open_file_folder: [api/config/layers](https://github.com/kalisio/kano/tree/master/config/layers) de Kano.

## Licence

Les données dérivées sont publiées sous la licence des données sources.

Les codes sources sont publiés sous licence MIT.
