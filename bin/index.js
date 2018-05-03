#! /usr/bin/env node

const fs = require('fs')
const mkdirp = require('mkdirp')
const readline = require('readline')
const { google } = require('googleapis')
const moment = require('moment')
const Table = require('cli-table')
const math = require('mathjs')
const parse = require('csv-parse')
const OAuth2Client = google.auth.OAuth2
const util = require('util')
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
const TOKEN_PATH = 'credentials.json'

const readFile = util.promisify(fs.readFile)

const program = require('commander')
  .version('1.0.0')
  .option('-p, --people [people]', 'CSV file of person,role', 'people')
  .option('-c, --credentials [credentials]', 'JSON file of Google credentials')
  .option('-v, --verbose', 'Log additional information', 'verbose')
  .option('--start [start]', 'Start date')
  .option('--end [end]', 'End date')
  .parse(process.argv);

if (!(program.people && program.credentials && program.start && program.end)) {
  program.outputHelp()
  process.exit(1)
}


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed
  const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0])

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback)
    oAuth2Client.setCredentials(JSON.parse(token))
    callback(oAuth2Client)
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })
  console.log('Authorize this app by visiting this url:', authUrl)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close()
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return callback(err)
      oAuth2Client.setCredentials(token)
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err)
        console.log('Token stored to', TOKEN_PATH)
      })
      callback(oAuth2Client)
    })
  })
}

function eventDuration(event) {
  const startDate = moment.parseZone(event.start.dateTime)
  const endDate = moment.parseZone(event.end.dateTime)

  if (event.summary && event.summary.match(/Weekly Product/)) {
    endDate.diff(startDate, 'hours', true)
  }

  return endDate.diff(startDate, 'hours', true)
}

function shouldBeTracked(event, email) {
  // Ignore day long events
  if (!(event.start.dateTime || event.end.dateTime)) return false

  const startDate = moment.parseZone(event.start.dateTime)
  const endDate = moment.parseZone(event.end.dateTime)

  // Do not count events > 3 hours
  if (eventDuration(event) >= 3) return false

  // Ignore meetings after 6p and before 8a
  if (startDate.hour() < 8 || startDate.hour() >= 20) return false

  // Ignore meetings at mealtimes
  if (startDate.hour() === 12 || (event.summary && event.summary.match(/lunch|dinner/i))) return false

  // Ignore blocked off times
  if (event.summary && event.summary.match(/DNB|OOO|Unavailable|personal|DNS/i)) return false

  // Ignore known events & social events
  if (event.summary && event.summary.match(/Barry's|@ HQ|drinks|meet up/i)) return false

  // Ignore declined events
  if (event.attendees && event.attendees.some((a) => a.email === email && a.responseStatus !== 'accepted')) return false

  // If self organized event with only self attending
  if (!event.attendees || (event.organizer && event.organizer.email === email && event.attendees && event.attendees.length == 1 && event.attendees[0].email === email)) {
    return false
  }

  // Ignore interviews
  if (event.summary && event.summary.match(/(interview|phone screen|tech screen|pairing|pair programming)/i)) return false

  return true
}

async function hoursOfMeetings(calendar, email) {
  return new Promise((resolve, reject) => {
    const startDate = moment(Date.parse(program.start)).startOf('day').utcOffset(-7)
    const endDate = moment(Date.parse(program.end)).endOf('day').utcOffset(-7)

    return calendar.events.list({
      calendarId: email,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      maxResults: 1000,
      orderBy: 'startTime'
    }, (err, response) => {
      if (err) return console.log('The API returned an error: ' + err)
      const { data } = response
      const events = data.items

      if (events.length) {
        if (program.verbose) console.log(`Person: ${email}`)

        const hours = events.reduce((sum, event, i) => {
          if (shouldBeTracked(event, email)) {
            sum += eventDuration(event)

            const start = event.start.dateTime || event.start.date
            if (program.verbose) console.log(`Tracking: ${start} - ${event.summary}: ${eventDuration(event)}`)
          }

          return sum
        }, 0)

        if (program.verbose) console.log(`Total: ${hours} hours`)
        return resolve(hours)
      } else {
        if (program.verbose) console.log('No upcoming events found.')
        return resolve(0)
      }
    })
  })
}

async function listEvents(auth) {
  const people = parse(await readFile(program.people), async (err, output) => {
    const calendar = google.calendar({version: 'v3', auth})
    const table = new Table({ head: ['Person', 'Hours in meetings', 'Role'] })

    const tracked = {
      all: []
    }

    for (var [person, role] of output) {
      let hours = await hoursOfMeetings(calendar, person)
      let label = person

      // Ignore people with 0 hours of accepted meetings, likely
      // on vacation
      if (hours > 1) {
        if (role) {
          tracked[role] = tracked[role] || []
          tracked[role].push(hours)
        }
        tracked.all.push(hours)
      } else {
        label += ' (ignored)'
      }

      table.push([ label, hours.toFixed(1), role || 'N/A' ])
    }


    for (var type in tracked) {
      const formattedType = type.charAt(0).toUpperCase() + type.slice(1)
      table.push([])
      table.push([`Mean (${formattedType})`, math.mean(tracked[type]).toFixed(1) ])
      table.push([`Median (${formattedType})`, math.median(tracked[type]).toFixed(1) ])
    }

    console.log(table.toString())
  })
}

async function run() {
  // Load client secrets from a local file.
  fs.readFile(program.credentials, (err, content) => {
    if (err) return console.log('Error loading client secret file:', err)
    // Authorize a client with credentials, then call the Google Drive API.
    authorize(JSON.parse(content), listEvents)
  })
}

run()
