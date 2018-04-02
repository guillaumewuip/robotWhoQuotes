const google = require('googleapis');

const sheets = google.sheets('v4');
const RANGE = 'Quotes!B:D';

const readSpreadsheeet = (id, range, apiKey) => (
  new Promise((resolve, reject) => {
    sheets.spreadsheets.values.get({
      auth:          apiKey,
      spreadsheetId: id,
      range,
    }, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response.values);
      }
    });
  })
);

const formatQuote = (data) => ({
  content: data[0] !== '' ? data[0] : undefined,
  author:  data[1] !== '' ? data[1] : undefined,
  source:  data[2] !== '' ? data[2] : undefined,
});

const random = (max) => Math.floor(Math.random() * (max + 1));

/**
 * Quotes
 *
 * @param  {Object} config
 * @param  {String} config.SPREADSHEET_ID
 * @param  {String} config.GOOGLE_API_KEY.
 */
const Quotes = (config) => {
  const quoteService = {
    getAll: () => readSpreadsheeet(
      config.SPREADSHEET_ID,
      RANGE,
      config.GOOGLE_API_KEY
    )
      .then((datas) => datas.map(formatQuote))
      .catch((err) => {
        console.error(err);
      }),
    getRandom: () => quoteService
      .getAll()
      .then((quotes) => {
        const index = random(quotes.length);
        console.log('Random index', index);
        return quotes[index];
      })
      .catch((err) => {
        console.error(err);
      }),
    get: (index) => quoteService
      .getAll()
      .then((quotes) => quotes[index])
      .catch((err) => {
        console.error(err);
      }),
  };

  return quoteService;
};

module.exports = Quotes;

