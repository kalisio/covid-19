const moment = require('moment')
const program = require('commander')

// By default try to grap data from now
program
    .option('-s, --start [date]', 'Change the start date of the data to be generated (defaults to 2020-03-01)', moment('2020-03-01').format('YYYY-MM-DD'))
    .option('-e, --end [date]', 'Change the end date of the data to be generated (defaults to yesterday)', moment().subtract(1, 'day').format('YYYY-MM-DD'))
    .option('-po, --port [port]', 'Change the port to be used (defaults to 5000)', 5000)
    .parse(process.argv)
const port = (program.port ? program.port + 1 : 5001)

let start = moment(program.start)
if (!start.isValid()) {
  console.error('Invalid start date, using 2020-03-01 as default')
  start = moment('2020-03-01')
}
let end = moment(program.end)
if (!end.isValid()) {
  console.error('Invalid end date, using yesterday as default')
  end = moment().subtract(1, 'day')
}

let tasks = []
let date = start
while (date.isSameOrBefore(end)) {
  tasks.push({
    id: `${date.format('YYYY-MM-DD')}`,
    type: 'noop',
    date
  })
  date = date.clone().add(1, 'day')
}

module.exports = {
  id: `job`,
  options: { faultTolerant: false, workersLimit: 1 },
  tasks,
  hooks: {
    tasks: {
      after: {
        csse: {
          hook: 'runCommand',
          stdout: true, stderr: true,
          command: `krawler csse-jobfile.js --port ${port} --date <%= date.format('YYYY-MM-DD') %>`
        },
        spfHospitalieres: {
          hook: 'runCommand',
          stdout: true, stderr: true,
          command: `krawler spf-donnees-hospitalieres-jobfile.js --port ${port} --date <%= date.format('YYYY-MM-DD') %>`
        },
        spfUrgences: {
          hook: 'runCommand',
          stdout: true, stderr: true,
          command: `krawler spf-donnees-urgences-sos-medecins-jobfile.js --port ${port} --date <%= date.format('YYYY-MM-DD') %>`
        },
        spfLaboratoires: {
          hook: 'runCommand',
          stdout: true, stderr: true,
          command: `krawler spf-donnees-laboratoires-jobfile.js --port ${port} --date <%= date.format('YYYY-MM-DD') %>`
        },
        regionsPoint: {
          hook: 'runCommand',
          stdout: true, stderr: true,
          command: `krawler france-regions-jobfile.js --port ${port} --geometry Point --date <%= date.format('YYYY-MM-DD') %>`
        },
        regionsPolygon: {
          hook: 'runCommand',
          stdout: true, stderr: true,
          command: `krawler france-regions-jobfile.js --port ${port} --geometry Polygon --date <%= date.format('YYYY-MM-DD') %>`
        },
        departementsPoint: {
          hook: 'runCommand',
          stdout: true, stderr: true,
          command: `krawler france-departements-jobfile.js --port ${port} --geometry Point --date <%= date.format('YYYY-MM-DD') %>`
        },
        departementsPolygon: {
          hook: 'runCommand',
          stdout: true, stderr: true,
          command: `krawler france-departements-jobfile.js --port ${port} --geometry Polygon --date <%= date.format('YYYY-MM-DD') %>`
        }
      }
    },
    jobs: {
      before: {
      },
      after: {
      }
    }
  }
}
