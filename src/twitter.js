const MAX_LENGTH = 280;
const MIN_DELAY_BETWEEN_TWEET = 1000;

const delay = (ms) => () => new Promise((resolve) => (
  setTimeout(() => resolve(), ms)
));

/**
 * @param  {String} tweet       New tweet
 * @param  {String} statusId    (optional) A tweet id when replying to someone
 */
const sendTweet = (T) => (tweet, statusId) => (
  new Promise((resolve, reject) => {
    const data = {
      status:                       tweet,
      auto_populate_reply_metadata: false,
    };

    if (statusId) {
      data.in_reply_to_status_id = statusId;
    }

    console.log('Send status to Twitter', data);

    T.post('statuses/update', data, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve({ id: result.id_str });
      }
    });
  })
);

const buildQuote = (quote) => {
  let tweet = quote.content;

  if (quote.author) {
    tweet += `\n${quote.author}`;
  }

  if (quote.source) {
    tweet += ` (${quote.source})`;
  }

  return tweet;
};

/**
 * concatToOptimalSize
 *
 * Takes a list of string and concat then with ch while the result is
 * smaller than maxLength
 *
 * @param  {Array}  blocks
 * @param  {number} maxLength
 * @param  {String} ch
 *
 * @return {Array}
 */
const concatToOptimalSize = (blocks, maxLength, ch) => blocks
  .reduce((result, current) => {
    const last = result.pop();

    // start of list
    if (!last) {
      return [current];
    }

    const totalLength = last.length + current.length;
    const limitLength = maxLength - ch.length - 1;

    // too long to append, need two blocks
    if (totalLength > limitLength) {
      return [
        ...result,
        `${last.trim() + ch}`,
        `${current}`,
      ];
    }

    return [
      ...result,
      `${last.trim()}${ch}${current.trim()}`,
    ];
  }, []);

/**
 * textSplit
 *
 * Split text by the delimiter given. If two successive parts make a
 * sentence smaller than maxLength, then merge them.
 *
 * @param  {String} text        Text to split
 * @param  {number} maxLength   Max line width
 * @param  {String} ch          Character to use as delimiter
 *
 * @return {Array}              Array of strings
 */
const textSplit = (text, maxLength, ch) => (
  concatToOptimalSize(text.split(ch), maxLength, ch)
);

/**
 * processSplit
 *
 * Apply textSplit if needed on each elements of blocks, then flatten the
 * array.
 *
 * @param  {Array}  blocks      The blocks to split
 * @param  {Number} maxLength   Max size of a block
 * @param  {String} ch          Character to use as delimiter
 *
 * @return {Array}              Array of strings
 */
const processSplit = (blocks, maxLength, ch) => blocks
  .map((block) => {
    if (block.length <= maxLength) {
      return [block];
    }
    return textSplit(block, maxLength, ch);
  })
  .reduce((result, current) => result.concat(current));

/**
 * buildTweets
 *
 * If needed because tweet is too long, produce the good number of tweets
 * below 140 characters and cut at the optimal moment.
 * Warning ! Could produce something bigger than 140 characters if can't
 * split enough with '\n', '.', ';', ',', '.', ' '
 *
 * @param  {String} tweet   Original content
 *
 * @return  {Array}         Array of strings
 */
const buildTweets = (tweet, prefix = '') => {
  const maxLength = MAX_LENGTH;

  let blocks = ['\n', '.', ';', ',', '.', ' ']
    .reduce(
      (result, ch) => processSplit(result, maxLength, ch),
      [tweet]
    );

  blocks = concatToOptimalSize(blocks, maxLength, '');

  return blocks.map((block, i) => `${i > 0 ? `${prefix} ` : ''}${block}`);
};

module.exports = {
  waitTweet: delay(MIN_DELAY_BETWEEN_TWEET),
  sendTweet,
  buildQuote,
  buildTweets,
};
