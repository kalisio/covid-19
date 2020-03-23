const _ = require('lodash')

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
          geometry: feature.geometry
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
