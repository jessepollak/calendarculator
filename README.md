# Calendarculator

A simple command line tool to calculate how much time people are spending in meetings.

_Note: this package has only been tested on Node 9_

## Setup

To get credentials, follow [Step 1 here](https://developers.google.com/calendar/quickstart/nodejs) to download a credentials file. This will be used to authenticate the requests.

## Usage

```bash

$ node index.js --credentials client_id.json --people people.csv --start 4/16/18 --end 4/20/18

┌──────────────────────┬───────────────────┬──────────┐
│ Person               │ Hours in meetings │ Role     │
├──────────────────────┼───────────────────┼──────────┤
│ user@gmail.com       │ 6.5               │ engineer │
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
```
