var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var tweetAnalytics = require('./tweet-analytics');

app.use(bodyParser.json());

app.post('/init', function(req, res) {
  res.sendStatus(200);
});

app.post('/run', function(req, res) {
  tweetAnalytics.process(req.body.value).then(function(analytics) {
    res.send({status: 'OK'});
  });
});

app.listen(8080, function() { console.log('Listening on 8080') });
