const path = require('path')
const _ = require('lodash')
const turf = require('@turf/turf')
const fs = require('fs-extra')

// Generate bed statistics by regions from departement entries
/*
const departements = fs.readJsonSync(path.join(__dirname, 'codes-departements-france.json'), { encoding: 'utf8' })
let regions = {}
departements.forEach(departement => {
  const region = departement.reg.toString()
  if (!regions[departement.reg]) regions[departement.reg] = []
  regions[departement.reg].push(departement.dep.toString())
})
const departementBeds = fs.readJsonSync(path.join(__dirname, 'lits-reanimation-departements-france.json'), { encoding: 'utf8' })
let regionBeds = {}
let bedCount = 0
_.forOwn(regions, (value, key) => {
  regionBeds[key] = { region: key, lits: 0 }
  value.forEach(departement => {
    const beds = _.find(departementBeds, item => item.departement.toString() === departement)
    if (beds) {
      console.log(`Found ${beds.lits} matching beds for department ${beds.libdepartement} in region ${key}`)
      regionBeds[key].lits += beds.lits
      bedCount += beds.lits
    }
  })
  console.log(`Found a total of ${regionBeds[key].lits} beds in region ${key}`)
})
console.log(`Found a total of ${bedCount} beds`)
fs.writeJsonSync(path.join(__dirname, 'lits-reanimation-regions-france.json'), _.values(regionBeds), { encoding: 'utf8' })
*/

// Properties mapping
const properties = {
  casConfirmes: 'Confirmed',
  deces: 'Deaths',
  gueris: 'Recovered',
  hospitalises: 'Severe',
  reanimation: 'Critical'
}

// Counters
let N = {}
_.forOwn(properties, (value, key) => {
  N[value] = 0
})

function max(matches, property) {
  let max = _.maxBy(matches, property)
  max = (max ? max[property] : 0)
  N[properties[property]] += max
  return max
}
    
module.exports = {
  properties,
  N,
  max,
  processAdministrativeData(file, geometry, populationFile, bedsFile, bedsCode) {
    // Read DB
    const data = fs.readJsonSync(path.join(__dirname, `${file}.geojson`), { encoding: 'utf8' })
    data.features.forEach(feature => {
      // Compute centroid of real geometry and update in place
      if (geometry === 'Point') {
        const centroid = turf.centroid(feature.geometry)
        feature.geometry = centroid.geometry
      }
    })
    // Add population data
    if (populationFile) {
      let count = 0
      let populationData = fs.readJsonSync(path.join(__dirname, `${populationFile}.json`), { encoding: 'utf8' })
      data.features.forEach(feature => {
        const population = populationData.find(element => element.Nom === feature.properties.nom)
        if (population) {
          count++
          // Convert population numbers stored as string in source files
          feature.Population = {
            Total: _.toNumber(population['Ensemble - Total'].replace(/ /g, '')),
            Under19: _.toNumber(population['Ensemble - 0 à 19 ans'].replace(/ /g, '')),
            Under39: _.toNumber(population['Ensemble - 20 à 39 ans'].replace(/ /g, '')),
            Under59: _.toNumber(population['Ensemble - 40 à 59 ans'].replace(/ /g, '')),
            Under74: _.toNumber(population['Ensemble - 60 à 74 ans'].replace(/ /g, '')),
            Over75: _.toNumber(population['Ensemble - 75 ans et plus'].replace(/ /g, ''))
          }
          console.log(`Found matching population of ${feature.Population.Total} for ${feature.properties.nom}`)
        }
      })
      console.log(`Found ${count} elements with matching population`)
    }
    // Add bed data
    if (bedsFile) {
      let count = 0
      let bedData = fs.readJsonSync(path.join(__dirname, `${bedsFile}.json`), { encoding: 'utf8' })
      data.features.forEach(feature => {
        const beds = bedData.find(element => element[bedsCode].toString() === feature.properties.code)
        if (beds) {
          count++
          feature.Beds = beds.lits
          console.log(`Found ${feature.Beds} matching beds for ${feature.properties.nom}`)
        }
      })
      console.log(`Found ${count} elements with matching beds`)
    }
    return data
  },
  processData(data, features, matcher) {
    const nbElements = features.length
    let count = 0
    features.forEach(feature => {
      // Find corresponding data, we use region number
      const matches = data.filter(matcher(feature))
      if (matches.length) {
        console.log(`Found matching element with code ${feature.properties.code}`)
        count++
        feature.match = {}
        // Iterate over data properties
        _.forOwn(properties, (value, key) => {
          // Keep track of max value
          const n = max(matches, key)
          if (n) {
            feature.match[value] = n
            console.log(`Found ${n} ${value}`)
          }
        })
      }
    })
    console.log(`Found data for ${count} elements on ${nbElements} elements`)
    _.forOwn(properties, (value, key) => {
      console.log(`Found a total of ${N[value]} ${value}`)
    })
    // Update data in-place
    data.splice(0, data.length)
    count = 0
    features.forEach(feature => {
      if (!_.isEmpty(feature.match)) {
        data.push(Object.assign({
          'Country/Region': 'France',
          'Province/State': feature.properties.nom,
          Population: feature.Population,
          Beds: feature.Beds,
          geometry: feature.geometry,
        }, feature.match))
      } else {
        count++
        //console.log(`Skipping empty data for element with code ${feature.properties.code}`, feature.properties)
      }
    })
    console.log(`Skipping empty data for ${count} elements`)
  },
  processPreviousData(features, previousFeatures) {
    const nbInitialElements = features.length
    previousFeatures.forEach(feature => {
      const data = features.find(element =>
        _.get(element, 'properties.Province/State') === _.get(feature, 'properties.Province/State'))
      console.log(`Merging data of ${_.get(feature, 'properties.Province/State')} with previously found elements`)
      // Use previous data if none found
      if (!data) {
        // Iterate over properties
        _.forOwn(properties, (value, key) => {
          if (feature.properties[value]) N[value] += feature.properties[value]
        })
        features.push(feature)
      } else { // Otherwise keep track of max values
        // Iterate over properties
        _.forOwn(properties, (value, key) => {
          if (feature.properties[value]) {
            if (data.properties[value] && (feature.properties[value] <= data.properties[value])) return
            N[value] += (feature.properties[value] - (data.properties[value] || 0))
            data.properties[value] = feature.properties[value]
          }
        })
      }
    })
    const nbTotalElements = features.length
    console.log(`Filled data with ${nbTotalElements - nbInitialElements} previously found elements`)
  }
}
