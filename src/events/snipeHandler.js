module.exports = (client) => {
    client.on("messageDelete", (message) => {
        if (!message.guild || message.author?.bot) return;
        if (!message.content && !message.attachments.size) return;

        try {
            const imageUrl = message.attachments.first()?.url ?? null;
            client.snipe.prepare(`
                INSERT INTO snipes (guildId, channelId, content, author, authorId, authorAvatar, timestamp, imageUrl)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                message.guild.id,
                message.channel.id,
                message.content ?? "",
                message.author?.tag ?? "Unknown",
                message.author?.id ?? null,
                message.author?.displayAvatarURL() ?? null,
                Date.now(),
                imageUrl,
            );
        } catch {}
    });
};
