const {
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    SeparatorBuilder,
    MessageFlags,
} = require("discord.js");

module.exports = {
    name: "snipe",
    aliases: ["s"],
    category: "moderation",
    cooldown: 5,

    run: async (client, message) => {
        const row = client.snipe.prepare(`
            SELECT * FROM snipes WHERE channelId = ? ORDER BY timestamp DESC LIMIT 1
        `).get(message.channel.id);

        if (!row) return client.util.container(message, `# Nothing to snipe\n-# No recently deleted messages in this channel.`);

        const timeAgo = `<t:${Math.floor(row.timestamp / 1000)}:R>`;
        const content = row.content?.slice(0, 1000) || "[no text content]";

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## Sniped Message\n-# Deleted ${timeAgo} by **${row.author}**`,
        ));
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
                .setThumbnailAccessory(new ThumbnailBuilder({
                    media: { url: row.authorAvatar || `https://api.dicebear.com/7.x/identicon/png?seed=${row.authorId}` },
                })),
        );

        return message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
    },
};
