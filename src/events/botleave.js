const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
} = require("discord.js");

module.exports = (client) => {
    client.on("guildDelete", async (guild) => {
        const LOG_CHANNEL_ID = client.config.botleave;
        const logChannel     = client.channels.cache.get(LOG_CHANNEL_ID);
        if (!logChannel) return;

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`### Luna left a server`),
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent([
                    `**Server:** ${guild.name}`,
                    `**ID:** \`${guild.id}\``,
                    `**Members:** ${guild.memberCount?.toLocaleString() ?? "N/A"}`,
                    `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                    ``,
                    `-# Total Servers: **${client.guilds.cache.size}**`,
                ].join("\n")),
            );

        await logChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
};
