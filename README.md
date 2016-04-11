# Let Me Hear You
This is a sample application for IBM Workshop.
The main purpose of this code is to load tweets mentioning particular account
and analyse sentiments. In case if tweet is pretty negative, we need do notify
customer relations manager immediately.

## Tech Behind
* OpenWhisk (+ CLI)
* Tone Analyzer
* Twitter API

## Setup instructions
* Create Tone Analyzer service and get its creds https://console.ng.bluemix.net/catalog/services/tone-analyzer/
* Register at Twillio and record SID and Access Key
* Register a couple of Twitter accounts: one for Company and one for User
* Using the Company, create a Twitter app (https://apps.twitter.com/app/new) and store the creds
* Pull all your creds to .env file
* Run `script/deploy`
* Invoke it with `script/invoke`
