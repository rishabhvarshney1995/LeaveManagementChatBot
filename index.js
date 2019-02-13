const dotenv = require('dotenv');
const path = require('path');
const restify = require('restify');

const {
    BotFrameworkAdapter,
    MemoryStorage,
    ConversationState,
    UserState
} = require('botbuilder');

const { BotConfiguration } = require('botframework-config');

const { MyBot } = require('./bot');

const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

const DEV_ENVIRONMENT = 'development';

const BOT_CONFIGURATION = process.env.NODE_ENV || DEV_ENVIRONMENT;

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${ server.name } listening to ${ server.url }`);
});

const BOT_FILE = path.join(__dirname, process.env.botFilePath || '');

let botConfig;
try {
    botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
} catch (err) {
    console.log("Could not load in sync the bot file.");
    process.exit();
}

const endpointConfig = botConfig.findServiceByNameOrId(BOT_CONFIGURATION);
const LUIS_CONFIGURATION = process.env.luisAppName;
const luisConfig = botConfig.findServiceByNameOrId(LUIS_CONFIGURATION);
const luisApplication = {
    applicationId: luisConfig.appId,
    endpointKey: luisConfig.subscriptionKey || luisConfig.authoringKey,
    azureRegion: luisConfig.region
};

const luisPredictionOptions = {
    includeAllIntents: true,
    log: true,
    staging: false
};

const adapter = new BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword
});

adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError]: ${ error }`);
    await context.sendActivity(`Oops. Something went wrong!`);

    await conversationState.delete(context);
    await userState.delete(context);
};

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

const myBot = new MyBot(luisApplication, luisPredictionOptions,conversationState, userState);

server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async context => {
        // Route to main dialog.
        await myBot.onTurn(context);
    });
});
