const { PermissionFlagsBits } = require("discord.js");
const AntiNukeMemory = require("../../core/antinukeMemory");

module.exports = {
    name: "inspect",
    aliases: ["userinfo", "ui"],
    category: "moderation",
    cooldown: 5,

    run: async (client, message, args) => {
        const target = message.mentions.members.first() ||
            await message.guild.members.fetch(args[0]?.replace(/[<@!>]/g, "") || message.author.id).catch(() => null);

        if (!target) return client.util.container(message, `# User Not Found\n-# Mention a user or provide their ID.`);

        const g    = AntiNukeMemory.get(message.guild.id);
        const user = target.user;

        const accountAge  = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;
        const joinedAt    = target.joinedAt ? `<t:${Math.floor(target.joinedAt.getTime() / 1000)}:R>` : "Unknown";
        const isOwner     = target.id === message.guild.ownerId;
        const isExtraOwner = g?.extraOwners?.has(target.id) ?? false;
        const isWhitelisted = g?.whitelist?.has(target.id) ?? false;
        const isQuarantined = g?.punishedUsers?.has(target.id) ?? false;
        const hasAdmin    = target.permissions.has(PermissionFlagsBits.Administrator);
        const topRole     = target.roles.highest.id !== message.guild.id ? target.roles.highest : null;

        const lines = [
            `## User Inspect — ${user.tag}`,
            `**ID:** \`${user.id}\``,
            `**Account Created:** ${accountAge}`,
            `**Joined Server:** ${joinedAt}`,
            `**Top Role:** ${topRole ?? "No roles"}`,
            `**Total Roles:** ${target.roles.cache.size - 1}`,
            `**Has Administrator:** ${hasAdmin ? "Yes" : "No"}`,
            `**Server Owner:** ${isOwner ? "Yes" : "No"}`,
        ];

        if (g?.enabled) {
            lines.push(`**Extra Owner:** ${isExtraOwner ? "Yes" : "No"}`);
            lines.push(`**Whitelisted:** ${isWhitelisted ? "Yes" : "No"}`);
            if (isQuarantined) lines.push(`**Quarantined:** Yes`);
        }

        return client.util.container(message, lines.join("\n"));
    },
};
