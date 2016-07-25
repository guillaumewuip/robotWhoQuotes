
'use strict';

(() => {

    const MAX_LENGTH = 140;

    const send = (T) => {

        /**
         * @param  {String} tweet       New tweet
         * @param  {String} statusId    (optional) A tweet id when replying to
         *                              someone
         */
        return (tweet, statusId) => {

            return new Promise((resolve, reject) => {

                const data = {
                    status: tweet,
                };

                if (statusId) {
                    data.in_reply_to_status_id = statusId;
                }

                console.log('Send status to Twitter', data);

                T.post('statuses/update', data, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        };
    };

    const buildQuote = (quote) => {

        let tweet = quote.content;

        if (quote.author) {
            tweet += `\n${quote.author}`;
        }

        if (quote.source) {
            tweet += ` (${quote.source})`;
        }

        return Promise.resolve(tweet);
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
    const concatToOptimalSize = (blocks, maxLength, ch) => {
        return blocks.reduce((result, current) => {
            const last = result.pop();

            //start of list
            if (!last) {
                return [current];

            //too long to append, need two blocks
            } else if (last.length + current.length > maxLength - ch.length - 1) {
                return result.concat([last + ch, current]);

            //we can append
            } else {
                result.push(`${last}${ch}${current}`);
                return result;
            }

        }, []);
    };

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
    const textSplit = (text, maxLength, ch) => {
        return concatToOptimalSize(text.split(ch), maxLength, ch);
    };

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
    const processSplit = (blocks, maxLength, ch) => {
        return blocks
            .map((block) => {
                if (block.length <= maxLength) {
                    return [block];
                }
                return textSplit(block, maxLength, ch);
            })
            .reduce((result, current) => {
                return result.concat(current);
            });
    };

    /**
     * buildTweets
     *
     * If needed because tweet is too long, produce the good number of tweets
     * below 140 characters and cut at the optimal moment.
     * Warning ! Could produce something bigger than 140 characters if can't
     * split enough with '\n', '.', ';', ',', '.', ' '
     *
     * @param  {String} tweet   Original content
     * @param  {String} prefix  Something to append before each tweet
     *
     * @return  {Array}         Array of strings
     */
    const buildTweets = (tweet, prefix = '') => {
        const maxLength = MAX_LENGTH - prefix.length;

        let blocks = ['\n', '.', ';', ',', '.', ' '].reduce((result, ch) => {
            return processSplit(result, maxLength, ch);
        }, [tweet]);

        blocks = concatToOptimalSize(blocks, maxLength, '');

        return blocks.map((block) => prefix + block);
    };

    module.exports = {
        send,
        buildQuote,
        buildTweets,
    };

})();
