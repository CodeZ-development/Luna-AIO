"use strict";

const AntiNukeMemory = require("../core/antinukeMemory");

module.exports = (client) => {
    client.on("guildDelete", (guild) => {
        AntiNukeMemory.delete(guild.id);
        client.logger.warn(`[Luna] Left guild ${guild.name} — antinuke cache cleared`);
    });
};
