"use strict";

const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const emoji = require("../../core/emoji");

module.exports = {
    name: "say",
    aliases: ["echo"],
    description: "Send a message as the bot to a channel.",
    category: "system",
    ownerOnly: true,
    async execute(client, message, args) {
        let target  = message.channel;
        let textStart = 0;

        const mention = message.mentions.channels.first();
        if (mention) {
            target    = mention;
            textStart = 1;
        }

        const text = args.slice(textStart).join(" ");
        if (!text) return message.reply(`Usage: \`${client.prefix}say [#channel] <message>\``);

        const sent = await target.send(text).catch(() => null);

        const c = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                sent
                    ? `${emoji.success} Sent in <#${target.id}>`
                    : `${emoji.error} Failed to send — missing permissions.`,
            ),
        );

        return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
    },
};
