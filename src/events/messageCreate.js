const commandExecution        = require("../handlers/commandExecution");
const { checker }             = require("../commands/automod/automod");
const { handleAntinukeMention } = require("./antimention");

const mcooldown = new Set();

module.exports = async (client) => {
    client.on("messageCreate", async (message) => {
        if (!message.guild) return;

        handleAntinukeMention(client, message).catch(() => {});

        if (message.author.bot) return;

        checker(message);

        try {
            const blacklisted = await client.util.BlacklistCheck(message.guild);
            if (blacklisted) return;

            await client.util.setPrefix(message);

            if (message.content === `<@${client.user.id}>`) {
                if (mcooldown.has(message.author.id)) return;
                mcooldown.add(message.author.id);
                setTimeout(() => mcooldown.delete(message.author.id), 4000);
                return client.util.container(message, `Use \`${message.guild.prefix || "?"}help\` to see all commands.\n\n**Website:** razebot.site | **Discord:** discord.gg/codez`);
            }

            const prefix     = message.guild.prefix || "?";
            const mentionRx  = new RegExp(`^<@!?${client.user.id}>`);
            const usedPrefix = message.content.match(mentionRx)?.[0] ?? prefix;

            const npUsers = client.noprefix || [];
            const hasNP   = npUsers.includes(message.author.id);

            if (!hasNP && !message.content.startsWith(usedPrefix)) return;

            const args = (hasNP && !message.content.startsWith(usedPrefix))
                ? message.content.trim().split(/ +/)
                : message.content.slice(usedPrefix.length).trim().split(/ +/);

            const cmd = args.shift().toLowerCase();
            if (!cmd) return;

            const command = client.commands.get(cmd);
            if (!command) return;

            const blacklistdb = client.blacklist || [];
            if (blacklistdb.includes(message.author.id) && !client.config.owner.includes(message.author.id)) {
                return client.util.container(message, "You are blacklisted from using Luna.\n\nIf you think this is a mistake, join discord.gg/codez");
            }

            await commandExecution.executeCommand(client, message, command, args);
        } catch (err) {
            if (err.code === 429) await client.util.handleRateLimit();
            console.error("messageCreate error:", err);
        }
    });
};
