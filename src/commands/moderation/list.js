const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "list",
    aliases: ["serverlist"],
    category: "moderation",
    cooldown: 5,

    run: async (client, message, args) => {
        const sub = args[0]?.toLowerCase();

        if (sub === "admins") {
            const admins = [];
            const members = await message.guild.members.fetch().catch(() => null);
            if (!members) return client.util.container(message, `# Error\n-# Could not fetch members.`);

            for (const [, member] of members) {
                if (member.permissions.has(PermissionFlagsBits.Administrator) && !member.user.bot) {
                    admins.push(`${member.user.tag} | \`${member.id}\``);
                }
            }

            if (!admins.length) return client.util.container(message, `# Admin Members\n-# No members with Administrator permission found.`);
            return client.util.lunaPagination(admins, `Admin Members (${admins.length})`, client, message);
        }

        if (sub === "adminrole" || sub === "adminroles") {
            const roles = message.guild.roles.cache
                .filter((r) => r.id !== message.guild.id && r.permissions.has(PermissionFlagsBits.Administrator))
                .sort((a, b) => b.position - a.position)
                .map((r) => `${r.name} | \`${r.id}\``);

            if (!roles.length) return client.util.container(message, `# Admin Roles\n-# No roles with Administrator permission found.`);
            return client.util.lunaPagination([...roles], `Admin Roles (${roles.length})`, client, message);
        }

        if (sub === "bots") {
            const members = await message.guild.members.fetch().catch(() => null);
            if (!members) return client.util.container(message, `# Error\n-# Could not fetch members.`);
            const bots = members.filter((m) => m.user.bot).map((m) => `${m.user.tag} | \`${m.id}\``);
            if (!bots.length) return client.util.container(message, `# Bots\n-# No bots found.`);
            return client.util.lunaPagination([...bots], `Bots (${bots.length})`, client, message);
        }

        return client.util.container(message,
            `## List Commands\n\n` +
            `\`${message.guild.prefix || "?"}list admins\` — Members with Administrator\n` +
            `\`${message.guild.prefix || "?"}list adminroles\` — Roles with Administrator\n` +
            `\`${message.guild.prefix || "?"}list bots\` — Bots in the server`,
        );
    },
};
