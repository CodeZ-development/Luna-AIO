module.exports = {
    name: "prefix",
    aliases: ["setprefix"],
    category: "moderation",
    cooldown: 5,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("ManageGuild")) {
            return client.util.container(message, `# Access Denied\n-# You need **Manage Server** permission.`);
        }

        const newPrefix = args[0];
        if (!newPrefix) return client.util.container(message, `# Current Prefix\n-# The current prefix is \`${message.guild.prefix || "?"}\`\n-# Usage: \`${message.guild.prefix || "?"}prefix <new_prefix>\``);
        if (newPrefix.length > 5) return client.util.container(message, `# Too Long\n-# Prefix must be 5 characters or less.`);

        await client.db.set(`prefix_${message.guild.id}`, newPrefix);
        message.guild.prefix = newPrefix;

        return client.util.container(message, `# Prefix Updated\n-# New prefix is \`${newPrefix}\`\n-# All commands now use this prefix.`);
    },
};
