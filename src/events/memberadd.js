const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
} = require("discord.js");

module.exports = (client) => {
    client.on("guildMemberAdd", async (member) => {
        if (!member.user.bot) return;
        if (member.user.id !== client.user.id) return;

        const LOG_CHANNEL_ID = client.config.botjoin;
        const logChannel     = client.channels.cache.get(LOG_CHANNEL_ID);
        if (!logChannel) return;

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`### Luna joined a server`),
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent([
                    `**Server:** ${member.guild.name}`,
                    `**ID:** \`${member.guild.id}\``,
                    `**Owner:** <@${member.guild.ownerId}> (\`${member.guild.ownerId}\`)`,
                    `**Members:** ${member.guild.memberCount.toLocaleString()}`,
                    `**Joined:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                    ``,
                    `-# Total Servers: **${client.guilds.cache.size}**`,
                ].join("\n")),
            );

        await logChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    });
};
