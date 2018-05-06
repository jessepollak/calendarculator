# calendarculator

A simple command line tool to calculate how much time people are spending in meetings. We use this at [@coinbase](https://twitter.com/coinbase) to track the hours per week engineers spend in meetings, then goal our teams on reducing that time. If you're interested in joining a team that takes a data driven approach to engineering culture, [DM me on Twitter](https://twitter.com/jessepollak).

_Note: this package has only been tested on Node 9_

## Setup

In order to use this tool, you'll need Google Calendar API credentials. To get credentials, follow [Step 1 here](https://developers.google.com/calendar/quickstart/nodejs) to download a credentials file. This will be used to authenticate the requests. With these credentials, you'll be able to see and analyze any calendars you can view in the Google Calendar web interface.

## Usage

```bash

$ # Ensure you are running on Node 9 or greater
$ npm install -g calendarculator
$ calendarculator --credentials client_id.json --people people.csv --start 4/16/18 --end 4/20/18

┌──────────────────────┬───────────────────┬──────────┐
│ Person               │ Hours in meetings │ Role     │
├──────────────────────┼───────────────────┼──────────┤
│ user@gmail.com       │ 6.5               │ engineer │
├──────────────────────┼───────────────────┼──────────┤
│ user2@gmail.com      │ 6.5               │ engineer │
├──────────────────────┼───────────────────┼──────────┤
│ user3@gmail.com      │ 6.5               │ engineer │
├──────────────────────┼───────────────────┼──────────┤
├──────────────────────┼───────────────────┼──────────┤
│ Mean (All)           │ 6.5               │          |
├──────────────────────┼───────────────────┼──────────┤
│ Median (All)         │ 6.5               │          |
├──────────────────────┼───────────────────┼──────────┤
├──────────────────────┼───────────────────┼──────────┤
│ Mean (Engineer)      │ 6.5               │          |
├──────────────────────┼───────────────────┼──────────┤
│ Median (Engineer)    │ 6.5               │          |
└──────────────────────┴───────────────────┴──────────┘

```

## File Format

```csv
user@gmail.com,engineer
user2@gmail.com,engineer
user3@gmail.com,engineer
```
