"use strict";

const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const emoji = require("../../core/emoji");

module.exports = {
    name: "leave",
    aliases: ["leaveserver"],
    description: "Force the bot to leave a server.",
    category: "system",
    ownerOnly: true,
    async execute(client, message, args) {
        const guildId = args[0] ?? message.guild.id;

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            const c = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${emoji.error} Server \`${guildId}\` not found.`),
            );
            return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }

        const name = guild.name;
        await guild.leave().catch(() => {});

        const c = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `${emoji.success} Left **${name}** \`${guildId}\``,
            ),
        );

        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    },
};
