const {google} = require('googleapis');
const sheets = google.sheets('v4');
const {auth} = require('google-auth-library');
const express = require('express');
const bodyParser = require('body-parser');

const LISTEN_PORT = 3001

const app = express();
app.use(bodyParser.text({
    type: 'text/plain',
}));

app.post('/api/v1/subscribe', async (req, res) => {
    try {
        const dateString = timestampToDateString(Date.now())
        const email = req.body
        await subscribe(email, dateString);
        res.status(200).send('OK');
    } catch (e) {
        console.error(e)
        res.status(500).send('error saving bugreport');
    }
});

app.listen(LISTEN_PORT, () => console.log('listening on port ' + LISTEN_PORT));

async function authorize() {
  const keysEnvVar = process.env['CREDS'];
  if (!keysEnvVar) {
    throw new Error('The $CREDS environment variable was not found!');
  }
  const keys = JSON.parse(keysEnvVar)
  const authClient = auth.fromJSON(keys);
  if (authClient == null) {
    throw Error('authentication failed');
  }
  authClient.scopes = ['https://www.googleapis.com/auth/spreadsheets'];

  return authClient;
}

async function subscribe (email, date) {
  const authClient = await authorize();
  const request = {
    // The ID of the spreadsheet to update.
    spreadsheetId: '16MdKsweJyZ9yEjVtN7niwarjAWijqOIxzIywSW99mYU',

    // The A1 notation of a range to search for a logical table of data.
    // Values are appended after the last row of the table.
    range: 'A:B',

    // How the input data should be interpreted.
    valueInputOption: 'RAW',

    resource: {
      "values": [
        [date, email],
      ]
    },

    auth: authClient,
  };

  await sheets.spreadsheets.values.append(request)
  console.log('Append', {date, email})
}

const timestampToDateString = (timestamp, withTimezone = false) => {
  const date = new Date(timestamp);
  if (withTimezone) {
      date.setTime(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  }
  const prefix = (s, p) => ('' + p + s).substring(('' + s).length);
  const prefix2 = (s) => prefix(s, '00');
  const prefix3 = (s) => prefix(s, '000');
  const datePart = `${date.getUTCFullYear()}-${prefix2(date.getUTCMonth() + 1)}-${prefix2(date.getUTCDate())}`;
  const timePart = `${prefix2(date.getUTCHours())}:${prefix2(date.getUTCMinutes())}:${prefix2(date.getUTCSeconds())}.${prefix3(date.getUTCMilliseconds())}`;
  return `${datePart} ${timePart}`;
};

