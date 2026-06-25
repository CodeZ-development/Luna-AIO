const { Collection, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require("discord.js");

module.exports = {
    async executeCommand(client, message, command, args) {
        const maintain = client.maintenance;
        if (maintain && !client.config.owner.includes(message.author.id)) {
            return client.util.container(
                message,
                `# Luna - Maintenance Mode\n\nThe bot is currently undergoing maintenance. Please check back shortly.\n\n**Support:** [discord.gg/codez](https://discord.gg/codez)\n**Website:** [razebot.site](https://razebot.site)`,
            );
        }

        if (client.config.cooldown && !client.config.owner.includes(message.author.id)) {
            if (!client.cooldowns.has(command.name)) {
                client.cooldowns.set(command.name, new Collection());
            }

            const now          = Date.now();
            const timestamps   = client.cooldowns.get(command.name);
            const cooldownAmount = (command.cooldown ?? 5) * 1000;
            const commandLimit = 5;

            if (timestamps.has(message.author.id)) {
                const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

                if (now < expirationTime) {
                    const timeLeft = (expirationTime - now) / 1000;
                    let commandCount = timestamps.get(`${message.author.id}_count`) || 0;
                    commandCount++;
                    timestamps.set(`${message.author.id}_count`, commandCount);

                    if (commandCount > commandLimit) {
                        let blacklistedUsers = (await client.db.get("blacklist_user")) || {};
                        if (!blacklistedUsers[message.author.id]) {
                            blacklistedUsers[message.author.id] = {
                                addedBy:   "Luna AutoMod",
                                addedAt:   now,
                                reason:    "Command spam",
                                expiresAt: now + 86400000,
                            };
                            await client.db.set("blacklist_user", blacklistedUsers);
                            client.util.blacklist();
                        }
                        return client.util.container(
                            message,
                            `# Blacklisted for Spamming\n\nYou have been temporarily blacklisted for spamming commands.\n\n**Support:** [discord.gg/codez](https://discord.gg/codez)`,
                        );
                    }

                    if (!timestamps.has(`${message.author.id}_cd_sent`)) {
                        message.channel.send({
                            content: `Please wait \`${timeLeft.toFixed(1)}s\` before using this command again.`,
                        }).then((msg) => setTimeout(() => msg.delete().catch(() => {}), 4000));
                        timestamps.set(`${message.author.id}_cd_sent`, true);
                    }
                    return;
                }
            }

            timestamps.set(message.author.id, now);
            timestamps.set(`${message.author.id}_count`, 1);
            setTimeout(() => {
                timestamps.delete(message.author.id);
                timestamps.delete(`${message.author.id}_count`);
                timestamps.delete(`${message.author.id}_cd_sent`);
            }, cooldownAmount);
        }

        try {
            await command.run(client, message, args);

            client.cmd.prepare("UPDATE total_command_count SET count = count + 1 WHERE id = 1").run();

            const LOG_CHANNEL_ID = client.config.botcommandlog;
            const logChannel     = client.channels.cache.get(LOG_CHANNEL_ID);

            if (logChannel) {
                const timestamp = `<t:${Math.floor(Date.now() / 1000)}:F>`;
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Command Log"))
                    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                        `-# User: ${message.author.tag} (${message.author.id})`,
                        `-# Server: ${message.guild.name} (${message.guild.id})`,
                        `-# Channel: #${message.channel.name}`,
                        `-# Command: \`${command.name}\``,
                        `-# Input: \`\`\`${message.content.slice(0, 200)}\`\`\``,
                        `-# Time: ${timestamp}`,
                    ].join("\n")));
                logChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            }
        } catch (err) {
            if (err.code === 429) await client.util.handleRateLimit();
            client.logger.error(`Command error [${command.name}]: ${err.message}`);
            console.error(err);
        }
    },
};
