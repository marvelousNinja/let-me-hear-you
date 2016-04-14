var Promise = require('bluebird');
var Twitter = Promise.promisifyAll(require('twitter'));
var watson = require('watson-developer-cloud');
var twilio = require('twilio');

var MAX_TWEETS_PER_PAGE = 100;

/* Contains tweet ids that have been sent */
var flaggedTweets = [];

function twitterClient(params) {
  var client = new Twitter({
    consumer_key: params.twitter_consumer_key,
    consumer_secret: params.twitter_consumer_secret,
    access_token_key: params.twitter_access_token_key,
    access_token_secret: params.twitter_access_token_secret
  });

  return Promise.promisifyAll(client);
}

function toneAnalyzerClient(params) {
  var client = watson.tone_analyzer({
    url: params.tone_analyzer_url,
    username: params.tone_analyzer_username,
    password: params.tone_analyzer_password,
    version: 'v3-beta',
    version_date: '2016-02-11'
  });

  // Promisify fails with object not extensible...
  return client;
}

function twilioClient(params) {
  var client = twilio(params.twilio_sid, params.twilio_access_key);
  return Promise.promisifyAll(client);
}

function loadTweets(params) {
  return twitterClient(params)
    .getAsync('search/tweets', { q: params.twitter_account_display_name, count:MAX_TWEETS_PER_PAGE})
    .then(function(response) {
      return response.statuses;
    });
}

function analyzeTone(params, tweets) {
  var client = toneAnalyzerClient(params)
  return Promise.all(tweets.map(function(tweet) {
    return new Promise(function(resolve, reject) {
      client.tone({ text: tweet.text }, function(err, tone) {
      if (err)
        reject(err);
      else
        tweet.tones = tone.document_tone.tone_categories.filter(function(toneCategory) {
          return toneCategory.category_id === 'emotion_tone';
        })[0].tones;
        resolve(tweet);
      });
    });
  }));
}

function notifyOnAnger(params, tweets) {
  var negativeTones = ['anger', 'sadness', 'disgust'];
  var negativeTweets = [];
  var client = twilioClient(params);

  tweets.forEach(function(tweet) {
    tweet.tones.forEach(function(tone) {
      var toneId = tone.tone_id;
      var score = tone.score;
      var negativeTone = negativeTones.indexOf(toneId) !== -1;
      var alreadyFlagged = negativeTweets.indexOf(tweet) !== -1;

      if (negativeTone && score > 0.5 && !alreadyFlagged) {
        negativeTweets.push(tweet);
      }
    });
  });

  return Promise.all(negativeTweets.map(function(tweet) {
    return client.sendMessageAsync({
      to: params.manager_phone_number,
      from: params.twilio_phone_number,
      body: 'IMPORTANT! Unhappy tweet: ' + tweet.text + "\n" + 'https://twitter.com/' + tweet.user.screen_name + '/'
    }).then(function(){
      flaggedTweets.push(tweet.id);
    });
  }));
}

function process(params) {
  return loadTweets(params)
    .then(function(tweets) {
        var tweetsToAnalyze = [];
        tweets.forEach(function(tweet) {
          if(flaggedTweets.indexOf(tweet.id) == -1) {
            tweetsToAnalyze.push(tweet)
          }
        });
        return analyzeTone(params, tweetsToAnalyze)
      })
    .then(function(tweets) { return notifyOnAnger(params, tweets) });
}

module.exports = { process: process };
