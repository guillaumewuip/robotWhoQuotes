
'use strict';

(() => {

    const
        schedule         = require('node-schedule'),
        Twit             = require('twit'),
        nodeWit          = require('node-wit'),
        Wit              = nodeWit.Wit,
        witLogger        = nodeWit.log,
        twitterHelper    = require('./src/twitter');

    const INTRO_SENTENCES = [
        'Here\'s quote for you 📝',
        'Here we go 💝',
        '➡',
        'Here\'s your quote, have a nice day ! 🤖',
        'Thanks for asking 👍',
        'Have a nice day 👌',
        '',
    ];

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

        WIT_TOKEN = (() => {
            if (!process.env.WIT_TOKEN) {
                throw new Error('Need WIT_TOKEN');
            }
            return process.env.WIT_TOKEN;
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

    var T = new Twit({
        consumer_key:        TWITTER_CONSUMER_KEY,
        consumer_secret:     TWITTER_CONSUMER_SECRET,
        access_token:        TWITTER_ACCESS_TOKEN,
        access_token_secret: TWITTER_ACCESS_TOKEN_SECRET,
        timeout_ms:          60 * 1000, //not too low because stream will fail
    });

    const getIntroSentence = (sentences) => {
        const index = Math.floor(
            Math.random() * (sentences.length + 1)
        );
        return Promise.resolve(sentences[index]);
    };

    const sendTweets = (T, id) => {
        return (msgs) => {
            return Promise.all(
                msgs.map((msg) => twitterHelper.send(T)(msg, id))
            );
        };
    };

    const witActions = {
        send(request, response) {
            return new Promise((resolve, reject) => {

                console.log('Wit response', response);

                const
                    {sessionId, context} = request,
                    {tweet} = context;

                //we use sessionId to store both tweet id and user name
                //<id>-<name>
                const [id, name] = sessionId.split('-');

                return getIntroSentence(INTRO_SENTENCES)
                    .then((intro) => {
                        return twitterHelper.buildTweets(
                            `${intro}\n${tweet}`,
                            `@${name} `
                        );
                    })
                    .then(sendTweets(T, id))
                    .then(() => {
                        console.log('Twitter reply send');
                        resolve();
                    })
                    .catch((err) => {
                        console.log('Wit send error', err);
                        reject();
                    });
            });
        },
        getQuote({context}) {
            return quotes.getRandom()
                .then(twitterHelper.buildQuote)
                .then((tweet) => {
                    context.tweet = tweet;
                    return context;
                })
                .catch((err) => {
                    console.erro('getQuote wit error', err);
                });
        },
    };

    const wit = new Wit({
        accessToken: WIT_TOKEN,
        actions:     witActions,
        logger:      new witLogger.Logger(witLogger.DEBUG),
    });

    const sendRandomQuote = (T) => {
        quotes.getRandom()
            .then(twitterHelper.buildQuote)
            .then(twitterHelper.buildTweets)
            .then(sendTweets(T))
            .then(() => {
                console.log('Twitter status send');
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const replyToTweet = (wit)  => {
        return (tweet) => {
            const
                user = tweet.user.screen_name,
                id   = `${tweet.id}-${user}`,
                text = tweet.text;

            console.log('Get tweet', id, text);

            if (user === TWITTER_NAME) { //prevent infinite loop
                return;
            }

            wit.runActions(
                id,
                text,
                {} //context
            )
            .then(() => {
                console.log('runAction end');
            })
            .catch((err) => {
                console.error('Wit runActions error', err);
            });
        };
    };

    /*
     * Main
     */

    T.get('account/verify_credentials', {skip_status: true})
        .catch(function (err) {
            console.error('Twitter error verify_credentials', err);
            process.exit(1);
        })
        .then(() => {
            console.log('Twitter check credentials ok');
        });

    const mentionsStream = T.stream(
        'statuses/filter', {
            track: [`@${TWITTER_NAME}`],
        }
    );
    mentionsStream.on('error', (err) => {
        console.log('Stream error', err);
        process.exit(1);
    });
    mentionsStream.on('tweet', replyToTweet(wit));

    schedule.scheduleJob(
        '* 15 4 * *', //6h15
        sendRandomQuote.bind(null, T)
    );

})();
