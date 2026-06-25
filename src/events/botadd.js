const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
} = require("discord.js");

module.exports = (client) => {
    client.on("guildCreate", async (guild) => {
        const LOG_CHANNEL_ID = client.config.botjoin;
        const logChannel     = client.channels.cache.get(LOG_CHANNEL_ID);
        if (!logChannel) return;

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`### Luna added to a server`),
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent([
                    `**Server:** ${guild.name}`,
                    `**ID:** \`${guild.id}\``,
                    `**Owner:** <@${guild.ownerId}> (\`${guild.ownerId}\`)`,
                    `**Members:** ${guild.memberCount.toLocaleString()}`,
                    `**Joined:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                    ``,
                    `-# Total Servers: **${client.guilds.cache.size}**`,
                ].join("\n")),
            );

        await logChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
};
