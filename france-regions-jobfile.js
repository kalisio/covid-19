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

// Read regions DB
const regions = utils.processAdministrativeData('regions-france-outre-mer', program.geometry,
  'population-regions-france', 'lits-regions-france', 'reg_id')

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
    type: 'http',
    options: {
      url: 'https://raw.githubusercontent.com/opencovid19-fr/data/master/agences-regionales-sante/' +
           `${region}/${date.format('YYYY-MM-DD')}.yaml`
    }
  })
})
// Add SPF sources
tasks.push({
  id: `spf-${date.format('YYYY-MM-DD')}`,
  type: 'http',
  options: {
    url: 'https://raw.githubusercontent.com/opencovid19-fr/data/master/sante-publique-france/' +
         `${date.format('YYYY-MM-DD')}.yaml`
  }
})
tasks.push({
  id: `spf-donnees-hospitalieres-${date.format('MM-DD-YYYY')}.yaml`,
  type: 'store',
  options: {
    store: 'spf'
  }
})

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
        }, {
          id: 'spf',
          type: 'fs',
          options: { path: path.join(__dirname, 'spf-donnees-hospitalieres') }
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
            utils.processData(data, regions.features, feature => element => element.code.replace('REG-', '') === feature.properties.code)
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
              console.log(`Data processed for ${data.features.length} regions on ${regions.features.length} regions`)
              _.forOwn(utils.properties, (value, key) => {
                console.log(`Found a total of ${utils.N[value]} ${value}`)
              })
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
        removeStores: ['memory', 'fs', 'spf', 's3']
      }
    }
  }
}
