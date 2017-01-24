'use strict';

const Alexa = require(`./AlexaSkill`);
const _ = require(`lodash`);

const APP_ID = null;

const burritoBot = (() => {
  Alexa.call(this, APP_ID);
});

// This here is where we instantiate our skill
burritoBot.prototype = Object.create(Alexa.prototype);
burritoBot.prototype.constructor = burritoBot;

burritoBot.prototype.eventHandlers.onLaunch = ((launchRequest, session, response) => {
  const speechOutput = `Hello Nicholas.  I'm working on your order now.`;
  const repromptText = `Be patient.  Jesus christ.`;

  response.ask(speechOutput, repromptText);
});

burritoBot.prototype.eventHandlers.onSessionStarted = ((sessionStartedRequest, session) => {
  //This is where you put your instantiation stuff
});

burritoBot.prototype.eventHandlers.onSessionEnded = ((sessionEndedRequest, session) => {
  //This is the cleanup zone
});


burritoBot.prototype.intentHandlers = {
  "burritoIntent": function(intent, session, response) {

  }
};

exports.handler = ((event, context) => {
  const app = new burritoBot();
  app.execute(event, context);
});
