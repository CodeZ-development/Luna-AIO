const Autorole = require("../../models/autorole.js");

module.exports = {
    name: "autorole",
    aliases: ["ar"],
    category: "moderation",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("ManageRoles")) {
            return client.util.container(message, `# Access Denied\n-# You need **Manage Roles** permission.`);
        }

        const sub    = args[0]?.toLowerCase();
        const prefix = message.guild.prefix || "?";

        switch (sub) {
            case "add": {
                const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
                if (!role) return client.util.container(message, `Usage: \`${prefix}autorole add @role\``);
                if (!role.editable) return client.util.container(message, `# Cannot Use\n-# Luna cannot manage that role.`);

                await Autorole.updateOne({ _id: message.guild.id }, { $addToSet: { roles: role.id }, $set: { enabled: true } }, { upsert: true });
                return client.util.container(message, `# Autorole Added\n-# **${role.name}** will be given to new members.`);
            }

            case "remove": {
                const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
                if (!role) return client.util.container(message, `Usage: \`${prefix}autorole remove @role\``);

                await Autorole.updateOne({ _id: message.guild.id }, { $pull: { roles: role.id } });
                return client.util.container(message, `# Autorole Removed\n-# **${role.name}** removed from autorole.`);
            }

            case "bot": {
                const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
                if (!role) return client.util.container(message, `Usage: \`${prefix}autorole bot @role\``);
                if (!role.editable) return client.util.container(message, `# Cannot Use\n-# Luna cannot manage that role.`);

                await Autorole.updateOne({ _id: message.guild.id }, { $addToSet: { bots: role.id }, $set: { enabled: true } }, { upsert: true });
                return client.util.container(message, `# Bot Autorole Set\n-# **${role.name}** will be given to new bots.`);
            }

            case "reset": {
                await Autorole.updateOne({ _id: message.guild.id }, { $set: { roles: [], bots: [], enabled: false } }, { upsert: true });
                return client.util.container(message, `# Autorole Reset\n-# All autorole settings cleared.`);
            }

            case "list": {
                const data = await Autorole.findById(message.guild.id).lean();
                if (!data || (!data.roles.length && !data.bots.length)) {
                    return client.util.container(message, `# Autorole\n-# No autorole roles are configured.`);
                }

                const memberRoles = data.roles.map((id) => {
                    const r = message.guild.roles.cache.get(id);
                    return r ? `- ${r} | \`${id}\`` : `- Deleted | \`${id}\``;
                });
                const botRoles = data.bots.map((id) => {
                    const r = message.guild.roles.cache.get(id);
                    return r ? `- ${r} | \`${id}\`` : `- Deleted | \`${id}\``;
                });

                const text =
                    `## Autorole Configuration\n\n` +
                    `**Member Roles:**\n${memberRoles.length ? memberRoles.join("\n") : "None"}\n\n` +
                    `**Bot Roles:**\n${botRoles.length ? botRoles.join("\n") : "None"}`;

                return client.util.container(message, text);
            }

            default: {
                return client.util.container(message,
                    `## Autorole Commands\n\n` +
                    `\`${prefix}autorole add @role\` — Add role for new members\n` +
                    `\`${prefix}autorole remove @role\` — Remove a member autorole\n` +
                    `\`${prefix}autorole bot @role\` — Set role for new bots\n` +
                    `\`${prefix}autorole list\` — View configured roles\n` +
                    `\`${prefix}autorole reset\` — Clear all autorole settings`,
                );
            }
        }
    },
};
