const path = require('path')
const _ = require('lodash')
const fs = require('fs-extra')
const sift = require('sift')
const turf = require('@turf/turf')
const moment = require('moment')
const program = require('commander')

// By default try to grap latest data
program
    .option('-d, --date [date]', 'Change the date of the data to be generated (defaults to yesterday)', moment().subtract(1, 'day').format('YYYY-MM-DD'))
    .option('-g, --geometry [type]', 'Change the geometry type to be generated (defaults to point, ie centroids)', 'Point')
    .parse(process.argv)

// Read regions DB
const regions = fs.readJsonSync(path.join(__dirname, 'regions-france-outre-mer.geojson'))
regions.features.forEach(feature => {
  // Compute centroid of real geometry and update in place
  if (program.geometry === 'Point') {
    const centroid = turf.centroid(feature.geometry)
    feature.geometry = centroid.geometry
  }
})

const date = moment(program.date)
if (!date.isValid()) {
  console.error('Invalid date, using yesterday as default')
  date = moment().subtract(1, 'day')
}

// Read previous data if any to gill gaps
let yesterday = path.join(__dirname, 'regions-france',
  (program.geometry === 'Point' ? 'regions-france-' : 'regions-france-polygons-') + `${date.clone().subtract(1, 'day').format('YYYY-MM-DD')}.json`)
if (fs.pathExistsSync(yesterday)) {
  console.log('Reading data from previous day')
  yesterday = fs.readJsonSync(yesterday)
}

const regionsData = require('./ARS')

let tasks = []
regionsData.forEach(region => {
  tasks.push({
    id: `${region}-${date.format('YYYY-MM-DD')}`,
    region,
    type: 'http',
    options: {
      url: 'https://raw.githubusercontent.com/opencovid19-fr/data/master/agences-regionales-sante/' +
           `${region}/${date.format('YYYY-MM-DD')}.yaml`
    }
  })
})

let nbConfirmed = 0
let nbDeaths = 0

module.exports = {
  id: (program.geometry === 'Point' ? 'regions-france-' : 'regions-france-polygons-') + `${date.format('YYYY-MM-DD')}`,
  store: 'memory',
  options: { faultTolerant: true },
  tasks,
  hooks: {
    tasks: {
      after: {
        readYAML: {
          objectPath: 'donneesRegionales'
        }/*,
        writeJsonFS: {
          hook: 'writeJson',
          store: 'fs'
        }*/
      }
    },
    jobs: {
      before: {
        createStores: [{
          id: 'memory'
        }, {
          id: 'fs',
          options: { path: path.join(__dirname, 'regions-france') }
        },
        {
          id: 's3',
          options: {
            client: {
              accessKeyId: process.env.S3_ACCESS_KEY,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
            },
            bucket: process.env.S3_BUCKET
          }
        }]
      },
      after: {
        mergeJson: {
          by: 'code'
        },
        processData: {
          hook: 'apply',
          dataPath: 'result.data',
          function: (data) => {
            const nbRegions = regions.features.length
            let count = 0
            regions.features.forEach(feature => {
              // Find corresponding data, we use region number
              const match = data.find(element => element.code.replace('REG-', '') === feature.properties.code)
              if (match) {
                console.log(`Found matching region ${feature.properties.code} for data with code ${match.code}`)
                count++
                if (match.casConfirmes) nbConfirmed += match.casConfirmes
                if (match.deces) nbDeaths += match.deces
                feature.match = match
              }
            })
            console.log(`Found data for ${count} regions on ${nbRegions} regions`)
            // Update data in-place
            data.splice(0, data.length)
            count = 0
            regions.features.forEach(feature => {
              if (feature.match) {
                data.push({
                  'Country/Region': 'France',
                  'Province/State': feature.properties.nom,
                  Confirmed: feature.match.casConfirmes,
                  Deaths: feature.match.deces,
                  geometry: feature.geometry
                })
              } else {
                count++
                //console.log(`Skipping empty data for region ${feature.properties.code}`, feature.properties)
              }
            })
            console.log(`Skipping empty data for ${count} regions`)
          }
        },
        convertToGeoJson: {
        },
        fillGaps: {
          hook: 'apply',
          dataPath: 'result.data',
          function: (data) => {
            // Try to fill gaps with previous data
            if (yesterday.features) {
              const nbRegions = regions.features.length
              const nbInitialRegions = data.features.length
              yesterday.features.forEach(feature => {
                const previousData = data.features.find(element =>
                  _.get(element, 'properties.Province/State') === _.get(feature, 'properties.Province/State'))
                if (!previousData) {
                  if (feature.properties.Confirmed) nbConfirmed += feature.properties.Confirmed
                  if (feature.properties.Deaths) nbDeaths += feature.properties.Deaths
                  data.features.push(feature)
                }
              })
              const nbTotalRegions = data.features.length
              console.log(`Filled data with ${nbTotalRegions - nbInitialRegions} previously found regions`)
              console.log(`Data processed for ${nbTotalRegions} regions on ${nbRegions} regions`)
              console.log(`Found a total of ${nbConfirmed} confirmed cases and ${nbDeaths} deaths`)
            }
          }
        },
        writeJsonFS: {
          hook: 'writeJson',
          store: 'fs'
        },
        writeJsonS3: {
          hook: 'writeJson',
          store: 's3',
          key: `covid-19/regions-france/<%= id %>.json`,
          storageOptions: {
            ACL: 'public-read'
          }
        },
        clearOutputs: {},
        removeStores: ['memory', 'fs', 's3']
      }
    }
  }
}