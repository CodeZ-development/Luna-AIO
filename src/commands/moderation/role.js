module.exports = {
    name: "role",
    aliases: ["giverole", "removerole"],
    category: "moderation",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("ManageRoles")) {
            return client.util.container(message, `# Access Denied\n-# You need **Manage Roles** permission.`);
        }

        const sub    = args[0]?.toLowerCase();
        const prefix = message.guild.prefix || "?";

        if (!["add", "remove"].includes(sub)) {
            return client.util.container(message,
                `## Role Commands\n\n` +
                `\`${prefix}role add @user @role\` — Give a role\n` +
                `\`${prefix}role remove @user @role\` — Remove a role`,
            );
        }

        const target = message.mentions.members.first();
        const role   = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);

        if (!target) return client.util.container(message, `# User Not Found\n-# Mention a user.`);
        if (!role)   return client.util.container(message, `# Role Not Found\n-# Mention a role.`);
        if (!role.editable) return client.util.container(message, `# Cannot Manage\n-# Luna cannot manage that role (too high).`);
        if (role.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return client.util.container(message, `# Cannot Manage\n-# That role is higher than your highest role.`);
        }

        if (sub === "add") {
            if (target.roles.cache.has(role.id)) return client.util.container(message, `# Already Has Role\n-# **${target.user.tag}** already has **${role.name}**.`);
            await target.roles.add(role, `Role added by ${message.author.tag}`);
            return client.util.container(message, `# Role Added\n-# **${role.name}** given to **${target.user.tag}**.`);
        }

        if (!target.roles.cache.has(role.id)) return client.util.container(message, `# Does Not Have Role\n-# **${target.user.tag}** does not have **${role.name}**.`);
        await target.roles.remove(role, `Role removed by ${message.author.tag}`);
        return client.util.container(message, `# Role Removed\n-# **${role.name}** removed from **${target.user.tag}**.`);
    },
};
