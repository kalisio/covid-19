const path = require('path')
const fs = require('fs-extra')
const _ = require('lodash')
const moment = require('moment')
const program = require('commander')

// Build departements list for each region to compute region statistics
const departements = fs.readJsonSync(path.join(__dirname, 'codes-departements-france.json'), { encoding: 'utf8' })
let regions = {}
departements.forEach(departement => {
  const region = departement.reg.toString()
  if (!regions[region]) regions[region] = []
  regions[region].push(departement.dep.toString())
})

// By default try to grap latest data
program
    .option('-d, --date [date]', 'Change the date of the data to be generated (defaults to yesterday)', moment().subtract(1, 'day').format('YYYY-MM-DD'))
    .parse(process.argv)

const date = moment(program.date)
if (!date.isValid()) {
  console.error('Invalid date, using yesterday as default')
  date = moment().subtract(1, 'day')
}

module.exports = {
  id: 'spf-donnees-laboratoires',
  store: 'memory',
  tasks: [{
    id: `spf-donnees-laboratoires-${date.format('MM-DD-YYYY')}`,
    type: 'http',
    options: {
      url: `https://www.data.gouv.fr/fr/datasets/r/b4ea7b4b-b7d1-4885-a099-71852291ff20`
    }
  }],
  hooks: {
    tasks: {
      after: {
        readCSV: {
          headers: true,
          delimiter: ';'
        },
        transformJson: {
          filter: { jour: `${date.format('YYYY-MM-DD')}`, clage_covid: '0' }, // Select total not men/women data
          mapping: {
            dep: 'code',
            nb_test: 'testsLaboratoire',
            nb_pos: 'casConfirmesLaboratoire'
          },
          unitMapping: {
            testsLaboratoire: { asNumber: true, empty: 0 },
            casConfirmesLaboratoire: { asNumber: true, empty: 0 }
          },
          pick: ['code', 'testsLaboratoire', 'casConfirmesLaboratoire'],
          outputPath: 'donneesDepartementales'
        },
        donneesRegionales: {
          hook: 'apply',
          dataPath: 'result.data',
          function: (data) => {
          	const donneesDepartementales = data.donneesDepartementales
            data.donneesRegionales = []
            _.forOwn(regions, (value, key) => {
              // Find matches
              const entries = _.filter(donneesDepartementales, element => value.includes(element.code))
              if (entries.length > 1) data.donneesRegionales.push(_.reduce(entries, (total, entry) => {
                return {
                  code: key,
                  testsLaboratoire: total.testsLaboratoire + entry.testsLaboratoire,
                  casConfirmesLaboratoire: total.casConfirmesLaboratoire + entry.casConfirmesLaboratoire
                }
              }, entries.shift()))
              else if (entries.length > 0) data.donneesRegionales.push(Object.assign({ code: key }, _.omit(entries[0], ['code'])))
            })
            data.donneesNationales = {}
            if (data.donneesRegionales.length > 0) data.donneesNationales = _.reduce(_.tail(data.donneesRegionales), (total, entry) => {
              return {
                testsLaboratoire: total.testsLaboratoire + entry.testsLaboratoire,
                casConfirmesLaboratoire: total.casConfirmesLaboratoire + entry.casConfirmesLaboratoire
              }
            }, _.head(data.donneesRegionales))
          }
        },
        writeYAML: {
          store: 'fs'
        }
      }
    },
    jobs: {
      before: {
        createStores: [{
          id: 'memory'
        }, {
          id: 'fs',
          options: { path: path.join(__dirname, 'spf-donnees-laboratoires') }
        }]
      },
      after: {
        clearOutputs: {},
        removeStores: ['memory', 'fs']
      }
    }
  }
}
