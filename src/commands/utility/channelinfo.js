const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require("discord.js");

module.exports = {
    name: "channelinfo",
    aliases: ["ci"],
    category: "utility",
    cooldown: 5,

    run: async (client, message, args) => {
        const channel = message.mentions.channels.first() ||
            message.guild.channels.cache.get(args[0]) ||
            message.channel;

        const created = `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`;

        const container = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `## Channel — #${channel.name}\n-# ID: \`${channel.id}\``,
            ))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `**Type:** ${channel.type}\n` +
                `**Category:** ${channel.parent?.name ?? "None"}\n` +
                `**Created:** ${created}\n` +
                `**Position:** ${channel.rawPosition}\n` +
                `**Topic:** ${channel.topic || "None"}\n` +
                `**NSFW:** ${channel.nsfw ? "Yes" : "No"}`,
            ));

        return message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
    },
};
