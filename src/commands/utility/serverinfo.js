const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

module.exports = {
    name: "serverinfo",
    aliases: ["si", "guildinfo"],
    category: "utility",
    cooldown: 5,

    run: async (client, message) => {
        const guild   = message.guild;
        const owner   = await guild.fetchOwner().catch(() => null);
        const members = guild.members.cache;
        const bots    = members.filter((m) => m.user.bot).size;
        const humans  = guild.memberCount - bots;

        const created = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`;

        const container = new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${guild.name}\n-# ID: \`${guild.id}\``,
                    ))
                    .setThumbnailAccessory(new ThumbnailBuilder({
                        media: { url: guild.iconURL({ extension: "png", size: 1024 }) || `https://api.dicebear.com/7.x/identicon/png?seed=${guild.id}` },
                    })),
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `**Owner:** ${owner ? `${owner.user.tag}` : "Unknown"} | \`${guild.ownerId}\`\n` +
                `**Created:** ${created}\n` +
                `**Members:** ${guild.memberCount.toLocaleString()} (${humans} humans, ${bots} bots)\n` +
                `**Roles:** ${guild.roles.cache.size}\n` +
                `**Channels:** ${guild.channels.cache.size}\n` +
                `**Verification:** ${guild.verificationLevel}\n` +
                `**Boosts:** ${guild.premiumSubscriptionCount ?? 0} (Tier ${guild.premiumTier})\n` +
                `**Emojis:** ${guild.emojis.cache.size}`,
            ));

        return message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
    },
};
