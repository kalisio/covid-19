const path = require('path')
const _ = require('lodash')
const fs = require('fs-extra')
const moment = require('moment')
const program = require('commander')
const utils = require('./utils')

// By default try to grap latest data
program
    .option('-d, --date [date]', 'Change the date of the data to be generated (defaults to yesterday)', moment().subtract(1, 'day').format('YYYY-MM-DD'))
    .option('-g, --geometry [type]', 'Change the geometry type to be generated (defaults to point, ie centroids)', 'Point')
    .parse(process.argv)

// Read departements DB
const departements = utils.processAdministrativeData('departements-france-outre-mer-500m', program.geometry,
  'population-departements-france', 'lits-departements-france', 'dep_id')

const date = moment(program.date)
if (!date.isValid()) {
  console.error('Invalid date, using yesterday as default')
  date = moment().subtract(1, 'day')
}

// Read previous data if any to gill gaps
let yesterday = path.join(__dirname, 'departements-france',
  (program.geometry === 'Point' ? 'departements-france-' : 'departements-france-polygons-') + `${date.clone().subtract(1, 'day').format('YYYY-MM-DD')}.json`)
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
// Add SPF sources
tasks.push({
  id: `spf-donnees-hospitalieres/spf-donnees-hospitalieres-${date.format('MM-DD-YYYY')}.yaml`,
  type: 'store',
  options: {
    store: 'fs'
  }
})
tasks.push({
  id: `spf-donnees-urgences-sos-medecins/spf-donnees-urgences-sos-medecins-${date.format('MM-DD-YYYY')}.yaml`,
  type: 'store',
  options: {
    store: 'fs'
  }
})
tasks.push({
  id: `spf-donnees-laboratoires/spf-donnees-laboratoires-${date.format('MM-DD-YYYY')}.yaml`,
  type: 'store',
  options: {
    store: 'fs'
  }
})
tasks.push({
  id: `spf-donnees-tests-pcr/spf-donnees-tests-pcr-${date.format('MM-DD-YYYY')}.yaml`,
  type: 'store',
  options: {
    store: 'fs'
  }
})

module.exports = {
  id: (program.geometry === 'Point' ? 'departements-france-' : 'departements-france-polygons-') + `${date.format('YYYY-MM-DD')}`,
  store: 'memory',
  options: { faultTolerant: true },
  tasks,
  hooks: {
    tasks: {
      after: {
        readYAML: {
          objectPath: 'donneesDepartementales'
        },
        /* DEBUG
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
          options: { path: __dirname }
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
        },
        processData: {
          hook: 'apply',
          dataPath: 'result.data',
          function: (data) => {
            utils.processData(data, departements.features, feature => element => element.code.replace('DEP-', '') === feature.properties.code)
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
              utils.processPreviousData(data.features, yesterday.features)
              console.log(`Data processed for ${data.features.length} departements on ${departements.features.length} departements`)
              _.forOwn(utils.properties, (value, key) => {
                let n = _.get(utils.N, value)
                console.log(`Found a total of ${n} ${value}`)
                if (!utils.cumulativeProperties.includes(value)) {
                  value = utils.getAccumulatedValue(value)
                  n = _.get(utils.N, value)
                  console.log(`Found a total of ${n} ${value}`)
                }
              })
            }
          }
        },
        writeJsonFS: {
          hook: 'writeJson',
          store: 'fs',
          key: `departements-france/<%= id %>.json`
        },
        writeJsonS3: {
          hook: 'writeJson',
          store: 's3',
          key: `covid-19/departements-france/<%= id %>.json`,
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
