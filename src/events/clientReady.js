const { ActivityType, Events } = require("discord.js");
const { loadAntiNuke } = require("../core/loadAntiNuke");
const { loadAutomodCache } = require("../commands/automod/automod");

module.exports = async (client) => {
    client.once(Events.ClientReady, async () => {
        client.ready = true;

        client.user.setPresence({
            activities: [{ name: "discord.gg/codez | razebot.site", type: ActivityType.Watching }],
            status: "dnd",
        });

        client.logger.success(`Luna online as ${client.user.tag}`);
        client.logger.info(`Serving ${client.guilds.cache.size} guilds | ${client.users.cache.size} users`);

        try { await loadAntiNuke(); }
        catch (err) { client.logger.error(`Failed to load antinuke: ${err.message}`); }

        try { await loadAutomodCache(); }
        catch (err) { client.logger.error(`Failed to load automod: ${err.message}`); }

        try {
            await client.util.noprefix();
            await client.util.blacklist();
            await client.util.blacklistserver();
            await client.util.MaintananceCheck();
        } catch (err) {
            client.logger.error(`Util init error: ${err.message}`);
        }

        const NoPrefixExpiryService = require("../handlers/noprefixExpiry");
        client.npExpiryService = new NoPrefixExpiryService(client, { intervalMs: 60_000 });
        await client.npExpiryService.start();
    });
};
