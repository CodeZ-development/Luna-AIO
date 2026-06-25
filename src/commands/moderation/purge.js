module.exports = {
    name: "purge",
    aliases: ["clear", "prune", "bulkdelete"],
    category: "moderation",
    cooldown: 5,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("ManageMessages")) {
            return client.util.container(message, `# Access Denied\n-# You need **Manage Messages** permission.`);
        }

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return client.util.container(message, `# Invalid Amount\n-# Provide a number between 1 and 100.\n-# Usage: \`${message.guild.prefix || "?"}purge <1-100> [@user]\``);
        }

        await message.delete().catch(() => {});

        let messages = await message.channel.messages.fetch({ limit: amount + 1 }).catch(() => null);
        if (!messages) return client.util.container(message, `# Error\n-# Could not fetch messages.`);

        const targetUser = message.mentions.users.first();
        if (targetUser) messages = messages.filter((m) => m.author.id === targetUser.id);

        const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        messages = messages.filter((m) => m.createdTimestamp > twoWeeksAgo);

        if (!messages.size) return client.util.container(message, `# No Messages\n-# No eligible messages found.`);

        const deleted = await message.channel.bulkDelete(messages, true).catch(() => null);
        const count   = deleted?.size ?? 0;

        const reply = await message.channel.send({
            content: `Deleted **${count}** message${count !== 1 ? "s" : ""}${targetUser ? ` from ${targetUser.tag}` : ""}.`,
        });
        setTimeout(() => reply.delete().catch(() => {}), 4000);
    },
};
