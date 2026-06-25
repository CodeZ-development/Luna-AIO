const { Client, Collection, Partials } = require("discord.js");

const config         = require("./Config");
const logger         = require("./logger");
const Utils          = require("./util");
const Sentinel       = require("./sentinel");
const LogSendHandler = require("./logSendHandler");

const registerErrorHandlers          = require("./handlers/errors");
const { initSQL, initMongo, initCache } = require("./loaders/database");
const loadCommands                   = require("./loaders/commands");
const loadEvents                     = require("./loaders/events");

module.exports = class Luna extends Client {
    constructor() {
        super({
            intents: 53608191,
            fetchAllMembers: true,
            allowedMentions: { parse: ["users"], repliedUser: true },
            partials: [Partials.Message, Partials.Channel, Partials.Reaction],
            sweepers: { messages: { interval: 300, lifetime: 1800 } },
        });

        this.config  = config;
        this.logger  = logger;
        this.color   = 0x7c3aed;
        this.support = "https://discord.gg/codez";
        this.website = "https://razebot.site";
        this.ready   = false;

        this.commands   = new Collection();
        this.cooldowns  = new Collection();
        this.rateLimits = new Collection();

        this.sntl           = new Sentinel(this);
        this.util           = new Utils(this);
        this.logSendHandler = new LogSendHandler(this);

        this.setMaxListeners(Infinity);
        registerErrorHandlers(this);
    }

    async init() {
        await initMongo(this);
        await initCache(this);
        await initSQL(this);
        await loadEvents(this);
        await loadCommands(this);
        await this.login(this.config.TOKEN);
    }
};
