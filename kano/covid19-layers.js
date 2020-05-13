module.exports = function ({ wmtsUrl, wmsUrl, wcsUrl, k2Url, s3Url }) {
  return [
  {
    name: 'COVID-19 (CSSE)',
    description: 'Cases World-wide',
    tags: [
      'business'
    ],
    icon: 'fas fa-atlas',
    attribution: '',
    type: 'OverlayLayer',
    featureId: 'Province/State',
    leaflet: {
      type: 'heatmap',
      urlTemplate: `${s3Url}/krawler/covid-19/csse_covid_19_daily_reports/csse_covid_19_daily_report_<%= time.format('MM-DD-YYYY') %>.json`,
      valueField: 'Confirmed',
      // The unit is in pixel, meaning
      // 1 pixel radius (2 pixel diameter) at zoom level 0
      // ...
      // 64 pixel radius (128 pixel diameter) at zoom level 6
      // ...
      // We'd like an event to cover a range expressed as Km
      // According to https://groups.google.com/forum/#!topic/google-maps-js-api-v3/hDRO4oHVSeM
      // this means 1 pixel at level 7 so at level 0 we get 1 / 2^7
      radius: 1000 * 0.0078,
      minOpacity: 0,
      maxOpacity: 0.5,
      // scales the radius based on map zoom
      scaleRadius: true,
      // uses the data maximum within the current map boundaries
      // (there will always be a red spot with useLocalExtremas true)
      useLocalExtrema: false,
      min: 0,
      max: 10000,
      // The higher the blur factor is, the smoother the gradients will be
      blur: 0.8
    }
  },
  {
    name: 'COVID-19 FR Regions',
    description: 'Cases by regions in France',
    tags: [
      'business'
    ],
    icon: 'fas fa-atlas',
    attribution: '',
    type: 'OverlayLayer',
    featureId: 'Province/State',
    leaflet: {
      type: 'geoJson',
      realtime: true,
      sourceTemplate: `${s3Url}/krawler/covid-19/regions-france/regions-france-<%= time.format('YYYY-MM-DD') %>.json`,
      'marker-type': 'circleMarker',
      radius: `<%= 10 + Math.round(properties.Confirmed * 0.02) %>`,
      //radius : `<%= 10 + Math.round(properties.Confirmed / (properties.Population.Total * 0.000001) * 0.05) %>`,
      stroke: 'red',
      'stroke-opacity': 0,
      //'fill-opacity': 0.5,
      //'fill-color': 'green',
      'fill-opacity' : `<%= 0.5 + (0.1 * properties.Confirmed / properties.Beds.Total) %>`,
      'fill-color' : `<%= chroma.scale('BuPu').domain([-1,1])(0.1 * properties.Confirmed / properties.Beds.Total).hex() %>`,
      template: ['radius', 'fill-color', 'fill-opacity'],
      tooltip: {
        template: `<b><%= properties['Province/State'] %></br><% if (properties.Confirmed) { %> <%= properties.Confirmed %> cas<% } if (properties.Deaths) { %> - <%= properties.Deaths %> décès<% } %></b>`,
        //template : `<b><%= properties['Province/State'] %></br><% if (properties.Confirmed) { %> <%= properties.Confirmed %> cas<% } %><% if (properties.Beds.Total) { %> - <%= properties.Beds.Total %> lits<% } %></b>`,
        options : {
          permanent : true,
          opacity : 0.8,
          direction : 'top'
        }
      }
    },
    cesium: {
      type: 'geoJson',
      realtime: true,
      sourceTemplate: `${s3Url}/krawler/covid-19/regions-france/regions-france-polygons-<%= time.format('YYYY-MM-DD') %>.json`,
      entityStyle: {
        polygon: {
          height: 0,
          outline: false,
          extrudedHeight: '<%= 100 * (properties.Severe || 0) / (properties.Population.Total * 0.000001) %>',
          material : {
              type : 'ColorMaterialProperty',
              options : {
                  type : 'Color',
                  options : [ 
                      '<%= 1 - Math.min(0.25 + 0.001 * (properties.Severe || 0) / (properties.Population.Total * 0.000001), 1) %>', 
                      0, 
                      0.75, 
                      1
                  ]
              }
          }
        },
        template: ['polygon.extrudedHeight', 'polygon.material.options.options[0]']
      },
      tooltip: {
        template: `<%= properties['Province/State'] %>\n<% if (properties.Severe) { %> <%= properties.Severe %> hospitalisations<% } %>`
      }
    }
  },
  {
    name: 'COVID-19 FR Depts',
    description: 'Cases by departments in France',
    tags: [
      'business'
    ],
    icon: 'fas fa-atlas',
    attribution: '',
    type: 'OverlayLayer',
    featureId: 'Province/State',
    leaflet: {
      type: 'geoJson',
      realtime: true,
      sourceTemplate: `${s3Url}/krawler/covid-19/departements-france/departements-france-polygons-<%= time.format('YYYY-MM-DD') %>.json`,
      'marker-type': 'circleMarker',
      stroke: 'blue',
      'stroke-width': 0.5,
      'stroke-opacity': 0.5,
      'fill-opacity' : `<%= 0.25 + ((properties.Severe || 0 + properties.Critical || 0) / (properties.Population.Total * 0.001)) %>`,
      'fill-color' : `<%= chroma.scale('BuPu').domain([-1,1])((properties.Severe || 0 + properties.Critical || 0) / (properties.Population.Total * 0.001)).hex() %>`,
      //'fill-opacity': '<%= 0.5 + (0.1 * properties.Confirmed / properties.Beds.Total) %>',
      //'fill-color': `<%= chroma.scale('BuPu').domain([-1,1])(0.1 * properties.Confirmed / properties.Beds.Total).hex() %>`,
      template: ['fill-color', 'fill-opacity'],
      tooltip: {
        //template: `<b><%= properties['Province/State'] %></br><% if (properties.Confirmed) { %> <%= properties.Confirmed %> cas<% } %><% if (properties.Beds.Total) { %> - <%= properties.Beds.Total %> lits<% } %></b>`,
        template : `<b><%= properties['Province/State'] %></br><% if (properties.Severe && properties.Critical) { %> <%= (properties.Severe + properties.Critical) %> cas<% }\n %><% if (properties.Beds.Total) { %> - <%= properties.Beds.Total %> lits<% } %></b>`,
        options : {
          opacity : 0.8,
          direction : 'top'
        }
      }
    }
  },
  {
    name: 'COVID-19 FR Depts - Heatmap',
    description: 'Cases by departements in France',
    tags: [
      'business'
    ],
    icon: 'fas fa-atlas',
    attribution: '',
    type: 'OverlayLayer',
    featureId: 'Province/State',
    leaflet: {
      type: 'heatmap',
      urlTemplate: `${s3Url}/krawler/covid-19/departements-france/departements-france-<%= time.format('YYYY-MM-DD') %>.json`,
      //valueField: 'Confirmed',
      valueTemplate : `<%= (properties.Severe + properties.Critical) / properties.Beds.Total %>`,
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
      max: 1,
      // The higher the blur factor is, the smoother the gradients will be
      blur: 0.8
    }
  },
  {
    name: 'COVID-19 FR Patients',
    description: 'Patients in France',
    tags: [
      'business'
    ],
    icon: 'fas fa-procedures',
    attribution: '',
    type: 'OverlayLayer',
    featureId: 'icao',
    leaflet: {
      type: 'heatmap',
      url: `${s3Url}/krawler/covid-19/patients-france/patients-heatmap-france.json`,
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
  }]
}
