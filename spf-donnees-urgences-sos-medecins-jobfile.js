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
  id: 'spf-donnees-urgences-sos-medecins',
  store: 'memory',
  tasks: [{
    id: `spf-donnees-urgences-sos-medecins-${date.format('MM-DD-YYYY')}`,
    type: 'http',
    options: {
      url: `https://www.data.gouv.fr/fr/datasets/r/eceb9fb4-3ebc-4da3-828d-f5939712600a`
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
          filter: { date_de_passage: `${date.format('YYYY-MM-DD')}`, sursaud_cl_age_corona: '0' }, // Select total not men/women data
          mapping: {
            dep: 'code',
            nbre_pass_corona: 'urgences',
            nbre_pass_tot: 'urgencesTotal',
            nbre_hospit_corona: 'urgencesHospitalises',
            nbre_acte_corona: 'actes',
            nbre_acte_tot: 'actesTotal'
          },
          unitMapping: {
            urgences: { asNumber: true, empty: 0 },
            urgencesTotal: { asNumber: true, empty: 0 },
            urgencesHospitalises: { asNumber: true, empty: 0 },
            actes: { asNumber: true, empty: 0 },
            actesTotal: { asNumber: true, empty: 0 }
          },
          pick: ['code', 'urgences', 'urgencesTotal', 'urgencesHospitalises', 'actes', 'actesTotal'],
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
                  urgences: total.urgences + entry.urgences,
                  urgencesTotal: total.urgencesTotal + entry.urgencesTotal,
                  urgencesHospitalises: total.urgencesHospitalises + entry.urgencesHospitalises,
                  actes: total.actes + entry.actes,
                  actesTotal: total.actesTotal + entry.actesTotal
                }
              }, entries.shift()))
              else if (entries.length > 0) data.donneesRegionales.push(Object.assign({ code: key }, _.omit(entries[0], ['code'])))
            })
            data.donneesNationales = {}
            if (data.donneesRegionales.length > 0) data.donneesNationales = _.reduce(_.tail(data.donneesRegionales), (total, entry) => {
              return {
                urgences: total.urgences + entry.urgences,
                urgencesTotal: total.urgencesTotal + entry.urgencesTotal,
                urgencesHospitalises: total.urgencesHospitalises + entry.urgencesHospitalises,
                actes: total.actes + entry.actes,
                actesTotal: total.actesTotal + entry.actesTotal
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
          options: { path: path.join(__dirname, 'spf-donnees-urgences-sos-medecins') }
        }]
      },
      after: {
        clearOutputs: {},
        removeStores: ['memory', 'fs']
      }
    }
  }
}
