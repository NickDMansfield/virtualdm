'use strict'

const Dungeon = require(`dungeon-generator`);

var APP_ID = 'amzn1.ask.skill.d0fe50ad-7f5f-4c65-8911-57b75bd1b743'; //replace with "amzn1.echo-sdk-ams.app.[amzn1.echo-sdk-ams.appamzn1.ask.skill.d0fe50ad-7f5f-4c65-8911-57b75bd1b743]";


var AlexaSkill = require('./AlexaSkill');
let sum = 0;

//CONFIG DUNGEON
let dungeon = new Dungeon({
    size: [100, 100],
    seed: 'abcd', //omit for generated seed
    rooms: {
        initial: {
            min_size: [3, 3],
            max_size: [3, 3],
            max_exits: 1,
            position: [0, 0] //OPTIONAL pos of initial room
        },
        any: {
            min_size: [2, 2],
            max_size: [5, 5],
            max_exits: 4
        }
    },
    max_corridor_length: 6,
    min_corridor_length: 2,
    corridor_density: 0.5, //corridors per room
    symmetric_rooms: false, // exits must be in the center of a wall if true
    interconnects: 1, //extra corridors to connect rooms and make circular paths. not 100% guaranteed
    max_interconnect_length: 10,
    room_count: 10
});

dungeon.generate();

var VirtualDM = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
VirtualDM.prototype = Object.create(AlexaSkill.prototype);
VirtualDM.prototype.constructor = VirtualDM;

VirtualDM.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("VirtualDM onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

VirtualDM.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("VirtualDM onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to virtual Dungeon master.  How can I help you?";
    var repromptText = "Take your time.  You'll die long ere I do.";
    response.ask(speechOutput, repromptText);
};

VirtualDM.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("VirtualDM onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

VirtualDM.prototype.intentHandlers = {
    // register custom intent handlers
    "DieRollIntent": function (intent, session, response) {
        const dieSides = parseInt(intent.slots.Die.value);
        const rollAmt = (Math.ceil(Math.random() * dieSides));
        sum += rollAmt;
        response.ask("You rolled " + rollAmt.toString() + " out of " + dieSides.toString() + ".  Your new sum is " + sum.toString() + ". What else can I do for you?");
    },
    "DungeonIntent": function (intent, session, response) {
      response.ask("Your dungon has " + dungeon.rooms.length.toString() + " rooms.");
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("You can say hello to me!", "You can say hello to me!");
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the VirtualDM skill.
    var ff = new VirtualDM();
    ff.execute(event, context);
};
