
'use strict';

(() => {

    const
        google = require('googleapis'),
        sheets = google.sheets('v4');

    const RANGE = 'Quotes!B:D';

    const readSpreadsheeet = (id, range, api_key) => {
        return new Promise((resolve, reject) => {
            sheets.spreadsheets.values.get({
                auth:          api_key,
                spreadsheetId: id,
                range:         range,
            }, (err, response) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response.values);
                }
            });
        });
    };

    const formatQuote = (data) => {
        return {
            content: data[0] !== '' ? data[0] : undefined,
            author:  data[1] !== '' ? data[1] : undefined,
            source:  data[2] !== '' ? data[2] : undefined,
        };
    };

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

            getAll: () => {
                return readSpreadsheeet(
                    config.SPREADSHEET_ID,
                    RANGE,
                    config.GOOGLE_API_KEY
                ).then((datas) => {
                    return datas.map(formatQuote);
                })
                .catch((err) => {
                    console.error(err);
                });
            },

            getRandom: () => {
                return quoteService.getAll().then((quotes) => {
                    const index = random(quotes.length);
                    console.log('Random index', index);
                    return quotes[index];
                })
                .catch((err) => {
                    console.error(err);
                });
            },

            get: (index) => {
                return quoteService.getAll().then((quotes) => {
                    return quotes[index];
                })
                .catch((err) => {
                    console.error(err);
                });
            },

        };

        return quoteService;

    };

    module.exports = Quotes;

})();
