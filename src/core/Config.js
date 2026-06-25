require("dotenv").config();

module.exports = {
    TOKEN: process.env.TOKEN,
    MONGO_DB: process.env.MONGO_DB,
    cooldown: process.env.COOLDOWN === "true",
    botjoin: process.env.BOT_JOIN_CHANNEL,
    botleave: process.env.BOT_LEAVE_CHANNEL,
    botcommandlog: process.env.BOT_COMMAND_LOG_CHANNEL,
    owner: process.env.OWNERS,
    np: process.env.NP_USERS,
    invite: process.env.INVITE_LINK,
    support: "https://discord.gg/codez",
    website: "https://razebot.site",
};
