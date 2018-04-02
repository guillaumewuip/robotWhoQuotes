/* eslint-disable no-await-in-loop, no-restricted-syntax */
const schedule = require('node-schedule');
const Twit     = require('twit');
const dotenv   = require('dotenv');

const {
  sendTweet,
  buildQuote,
  buildTweets,
  waitTweet,
} = require('./src/twitter');

const Quotes = require('./src/quotes');

dotenv.config();

const SPREADSHEET_ID = (() => {
  if (!process.env.SPREADSHEET_ID) {
    throw new Error('Need SPREADSHEET_ID');
  }
  return process.env.SPREADSHEET_ID;
})();

const GOOGLE_API_KEY = (() => {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('Need GOOGLE_API_KEY');
  }
  return process.env.GOOGLE_API_KEY;
})();

const TWITTER_CONSUMER_KEY = (() => {
  if (!process.env.TWITTER_CONSUMER_KEY) {
    throw new Error('Need TWITTER_CONSUMER_KEY');
  }
  return process.env.TWITTER_CONSUMER_KEY;
})();

const TWITTER_CONSUMER_SECRET = (() => {
  if (!process.env.TWITTER_CONSUMER_SECRET) {
    throw new Error('Need TWITTER_CONSUMER_SECRET');
  }
  return process.env.TWITTER_CONSUMER_SECRET;
})();

const TWITTER_ACCESS_TOKEN = (() => {
  if (!process.env.TWITTER_ACCESS_TOKEN) {
    throw new Error('Need TWITTER_ACCESS_TOKEN');
  }
  return process.env.TWITTER_ACCESS_TOKEN;
})();

const TWITTER_ACCESS_TOKEN_SECRET = (() => {
  if (!process.env.TWITTER_ACCESS_TOKEN_SECRET) {
    throw new Error('Need TWITTER_ACCESS_TOKEN_SECRET');
  }
  return process.env.TWITTER_ACCESS_TOKEN_SECRET;
})();

const TWITTER_NAME = (() => {
  if (!process.env.TWITTER_NAME) {
    throw new Error('Need TWITTER_NAME');
  }
  return process.env.TWITTER_NAME;
})();

const quotes = Quotes({
  SPREADSHEET_ID,
  GOOGLE_API_KEY,
});

const T = new Twit({
  consumer_key:        TWITTER_CONSUMER_KEY,
  consumer_secret:     TWITTER_CONSUMER_SECRET,
  access_token:        TWITTER_ACCESS_TOKEN,
  access_token_secret: TWITTER_ACCESS_TOKEN_SECRET,
  timeout_ms:          60 * 1000, // not too low because stream will fail
});

const sendTweets = async (twit, msgs) => {
  let lastId = null;

  for (const msg of msgs) {
    const { id } = await sendTweet(twit)(msg, lastId);
    lastId = id;

    await waitTweet();
  }
};

const sendRandomQuote = async (twit, prefix) => {
  try {
    const quote = await quotes.getRandom();

    console.log(quote);

    await sendTweets(twit, buildTweets(buildQuote(quote), prefix));
    console.log('Twitter status send');
  } catch (err) {
    console.error(err);
  }
};

/*
 * Main
 */

T.get('account/verify_credentials', { skip_status: true })
  .catch(function (err) {
    console.error('Twitter error verify_credentials', err);
    process.exit(1);
  })
  .then(() => {
    console.log('Twitter check credentials ok');
  });

schedule.scheduleJob(
  '0 15 4 * * *', // 6h15
  () => sendRandomQuote(T, TWITTER_NAME)
);
