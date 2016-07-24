
'use strict';

(() => {

    const
        schedule = require('node-schedule'),
        Twit     = require('twit');
    const
        SPREADSHEET_ID = (() => {
            if (!process.env.SPREADSHEET_ID) {
                throw new Error('Need SPREADSHEET_ID');
            }
            return process.env.SPREADSHEET_ID;
        })(),

        GOOGLE_API_KEY = (() => {
            if (!process.env.GOOGLE_API_KEY) {
                throw new Error('Need GOOGLE_API_KEY');
            }
            return process.env.GOOGLE_API_KEY;
        })(),

        TWITTER_CONSUMER_KEY = (() => {
            if (!process.env.TWITTER_CONSUMER_KEY) {
                throw new Error('Need TWITTER_CONSUMER_KEY');
            }
            return process.env.TWITTER_CONSUMER_KEY;
        })(),

        TWITTER_CONSUMER_SECRET = (() => {
            if (!process.env.TWITTER_CONSUMER_SECRET) {
                throw new Error('Need TWITTER_CONSUMER_SECRET');
            }
            return process.env.TWITTER_CONSUMER_SECRET;
        })(),

        TWITTER_ACCESS_TOKEN = (() => {
            if (!process.env.TWITTER_ACCESS_TOKEN) {
                throw new Error('Need TWITTER_ACCESS_TOKEN');
            }
            return process.env.TWITTER_ACCESS_TOKEN;
        })(),

        TWITTER_ACCESS_TOKEN_SECRET = (() => {
            if (!process.env.TWITTER_ACCESS_TOKEN_SECRET) {
                throw new Error('Need TWITTER_ACCESS_TOKEN_SECRET');
            }
            return process.env.TWITTER_ACCESS_TOKEN_SECRET;
        })(),

        TWITTER_NAME = (() => {
            if (!process.env.TWITTER_NAME) {
                throw new Error('Need TWITTER_NAME');
            }
            return process.env.TWITTER_NAME;
        })();

    const quotes   = require('./src/quotes')({
        SPREADSHEET_ID,
        GOOGLE_API_KEY,
    });

    const sendToTwitter = (T) => {
        return (tweet) => {
            console.log('Send status to Twitter', tweet);
            T.post('statuses/update', {status: tweet}, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('Twitter status send');
                }
            });
        };
    };

    const buildTwitterQuote = (quote) => {

        let tweet = quote.content;

        if (quote.author) {
            tweet += `\n${quote.author}`;
        }

        if (quote.source) {
            tweet += ` (${quote.tweet})`;
        }

        return Promise.resolve(tweet);
    };

    const replyToTweet = (T)  => {
        return (tweet) => {
            //TODO
        };
    };

    const sendRandomQuote = (T) => {
        quotes.getRandom()
            .then(buildTwitterQuote)
            .then(sendToTwitter(T))
            .catch((err) => {
                console.error(err);
            });
    };

    var T = new Twit({
        consumer_key:        TWITTER_CONSUMER_KEY,
        consumer_secret:     TWITTER_CONSUMER_SECRET,
        access_token:        TWITTER_ACCESS_TOKEN,
        access_token_secret: TWITTER_ACCESS_TOKEN_SECRET,
        // optional HTTP request timeout to apply to all requests.
        timeout_ms:          20 * 1000,
    });

    T.get('account/verify_credentials', {skip_status: true})
        .catch(function (err) {
            console.error('Twitter error verify_credentials', err);
            process.exit(1);
        })
        .then(() => {
            console.log('Twitter check credentials ok');
        });

    T.stream(
        'statuses/filter', {
            track: [TWITTER_NAME],
        }
    ).on('tweet', replyToTweet(T));

    schedule.scheduleJob(
        '* 15 4 * *', //6h15
        sendRandomQuote.bind(null, T)
    );

})();
