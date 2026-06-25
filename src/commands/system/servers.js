module.exports = {
    name: "servers",
    aliases: ["guildlist"],
    category: "system",
    cooldown: 5,

    run: async (client, message) => {
        if (!client.config.owner.includes(message.author.id)) {
            return client.util.container(message, `# Access Denied\n-# This command is restricted to bot owners.`);
        }

        const guilds = client.guilds.cache.sort((a, b) => b.memberCount - a.memberCount);
        const lines  = guilds.map((g, i) => `${i + 1}. **${g.name}** | \`${g.id}\` | ${g.memberCount.toLocaleString()} members`);

        return client.util.lunaPagination([...lines], `Luna Servers (${guilds.size})`, client, message);
    },
};
