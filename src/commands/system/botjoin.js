module.exports = {
    name: "botjoin",
    aliases: ["joinchannel"],
    category: "system",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!client.config.owner.includes(message.author.id)) {
            return client.util.container(message, `# Access Denied\n-# This command is restricted to bot owners.`);
        }

        const guildId = args[0];
        if (!guildId) return client.util.container(message, `Usage: \`${message.guild.prefix || "?"}botjoin <guildId>\``);

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return client.util.container(message, `# Guild Not Found\n-# Luna is not in a guild with ID \`${guildId}\`.`);

        const lines = [
            `## Guild Info — ${guild.name}`,
            `**ID:** \`${guild.id}\``,
            `**Owner:** <@${guild.ownerId}> (\`${guild.ownerId}\`)`,
            `**Members:** ${guild.memberCount.toLocaleString()}`,
            `**Roles:** ${guild.roles.cache.size}`,
            `**Channels:** ${guild.channels.cache.size}`,
            `**Joined:** <t:${Math.floor(guild.joinedTimestamp / 1000)}:F>`,
        ];

        return client.util.container(message, lines.join("\n"));
    },
};
