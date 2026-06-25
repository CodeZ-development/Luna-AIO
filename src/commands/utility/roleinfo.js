const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require("discord.js");

module.exports = {
    name: "roleinfo",
    aliases: ["ri"],
    category: "utility",
    cooldown: 5,

    run: async (client, message, args) => {
        const role = message.mentions.roles.first() ||
            message.guild.roles.cache.get(args[0]) ||
            message.guild.roles.cache.find((r) => r.name.toLowerCase() === args.join(" ").toLowerCase());

        if (!role) return client.util.container(message, `# Role Not Found\n-# Mention a role or provide its ID or name.`);

        const members = await message.guild.members.fetch().catch(() => null);
        const memberCount = members ? members.filter((m) => m.roles.cache.has(role.id)).size : "?";

        const created = `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`;
        const hexColor = role.hexColor === "#000000" ? "Default" : role.hexColor.toUpperCase();

        const keyPerms = [
            "Administrator", "ManageGuild", "ManageRoles", "ManageChannels",
            "BanMembers", "KickMembers", "ManageMessages", "ManageWebhooks",
            "ViewAuditLog", "MentionEveryone",
        ].filter((p) => role.permissions.has(p));

        const container = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `## Role — ${role.name}\n-# ID: \`${role.id}\``,
            ))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `**Color:** ${hexColor}\n` +
                `**Position:** ${role.rawPosition}\n` +
                `**Members:** ${memberCount}\n` +
                `**Hoisted:** ${role.hoist ? "Yes" : "No"}\n` +
                `**Mentionable:** ${role.mentionable ? "Yes" : "No"}\n` +
                `**Managed:** ${role.managed ? "Yes (Bot/Integration)" : "No"}\n` +
                `**Created:** ${created}\n\n` +
                `**Key Permissions:**\n${keyPerms.length ? keyPerms.map((p) => `- ${p}`).join("\n") : "None"}`,
            ));

        return message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
    },
};
