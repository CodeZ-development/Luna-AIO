"use strict";

const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const emoji = require("../../core/emoji");

module.exports = {
    name: "dm",
    aliases: [],
    description: "DM a user as the bot.",
    category: "system",
    ownerOnly: true,
    async execute(client, message, args) {
        const userId = args[0]?.replace(/[<@!>]/g, "");
        const text   = args.slice(1).join(" ");

        if (!userId || !text) {
            return message.reply(`Usage: \`${client.prefix}dm <userId> <message>\``);
        }

        const user = await client.users.fetch(userId).catch(() => null);
        if (!user) return message.reply(`${emoji.error} User not found.`);

        const sent = await user.send(text).catch(() => null);

        const c = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                sent
                    ? `${emoji.success} DM sent to **${user.tag}** \`${user.id}\``
                    : `${emoji.error} Could not DM **${user.tag}** — DMs may be closed.`,
            ),
        );

        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    },
};
