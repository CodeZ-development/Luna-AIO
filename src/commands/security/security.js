const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
    PermissionFlagsBits,
} = require("discord.js");

function linesOrNone(lines) {
    return lines.length ? lines.join("\n") : "None";
}

module.exports = {
    name: "security",
    aliases: ["sec"],
    category: "security",
    cooldown: 5,

    run: async (client, message, args) => {
        if (!message.guild) return;

        const sub    = args[0]?.toLowerCase();
        const prefix = message.guild.prefix || "?";

        if (sub !== "scan") {
            return client.util.container(message,
                `## Security Commands\n\n` +
                `\`${prefix}security scan\` — Scan server for security risks\n\n` +
                `-# Shows admin roles, roles above the bot, missing permissions, and mentionable admin roles.`,
            );
        }

        const botRole = message.guild.members.me.roles.highest;

        const adminRoles = message.guild.roles.cache
            .filter((r) => r.id !== message.guild.id && r.permissions.has(PermissionFlagsBits.Administrator))
            .sort((a, b) => b.position - a.position)
            .map((r) => `- ${r} | \`${r.id}\``);

        const manageRoles = message.guild.roles.cache
            .filter((r) => r.id !== message.guild.id && r.permissions.has(PermissionFlagsBits.ManageRoles))
            .sort((a, b) => b.position - a.position)
            .map((r) => `- ${r} | \`${r.id}\``);

        const aboveBot = message.guild.roles.cache
            .filter((r) => r.id !== message.guild.id && r.position >= botRole.position)
            .sort((a, b) => b.position - a.position)
            .map((r) => `- ${r} | \`${r.id}\``);

        const mentionableAdmin = message.guild.roles.cache
            .filter((r) => r.id !== message.guild.id && r.mentionable && r.permissions.has(PermissionFlagsBits.Administrator))
            .sort((a, b) => b.position - a.position)
            .map((r) => `- ${r} | \`${r.id}\``);

        const missingPerms = [
            PermissionFlagsBits.Administrator,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.BanMembers,
            PermissionFlagsBits.KickMembers,
            PermissionFlagsBits.ViewAuditLog,
            PermissionFlagsBits.ManageWebhooks,
            PermissionFlagsBits.ManageGuild,
        ].filter((p) => !message.guild.members.me.permissions.has(p))
         .map((p) => `- ${String(p)}`);

        const text =
            `# Security Scan — ${message.guild.name}\n` +
            `**Luna Top Role:** ${botRole}\n\n` +
            `## Administrator Roles (${adminRoles.length})\n${linesOrNone(adminRoles.slice(0, 15))}\n\n` +
            `## Manage Roles (${manageRoles.length})\n${linesOrNone(manageRoles.slice(0, 10))}\n\n` +
            `## Roles At or Above Luna (${aboveBot.length})\n${linesOrNone(aboveBot.slice(0, 10))}\n\n` +
            `## Mentionable Admin Roles (${mentionableAdmin.length})\n${linesOrNone(mentionableAdmin.slice(0, 10))}\n\n` +
            `## Missing Luna Permissions\n${missingPerms.length ? missingPerms.join("\n") : "None — all permissions granted"}`;

        const container = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(text.slice(0, 3900)));

        return message.reply({ flags: MessageFlags.IsComponentsV2, components: [container], allowedMentions: { repliedUser: true } });
    },
};
