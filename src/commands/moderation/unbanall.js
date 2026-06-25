module.exports = {
    name: "unbanall",
    aliases: ["massunban"],
    category: "moderation",
    cooldown: 10,

    run: async (client, message) => {
        if (!message.member.permissions.has("BanMembers") || !message.member.permissions.has("Administrator")) {
            return client.util.container(message, `# Access Denied\n-# You need **Administrator** or **Ban Members** permission.`);
        }

        const bans = await message.guild.bans.fetch().catch(() => null);
        if (!bans || !bans.size) return client.util.container(message, `# No Bans\n-# There are no banned users in this server.`);

        const msg = await client.util.container(message, `# Unbanning All\n-# Processing **${bans.size}** bans. This may take a moment...`);

        let success = 0, failed = 0;
        for (const [id] of bans) {
            const ok = await message.guild.members.unban(id, `Mass unban by ${message.author.tag}`).catch(() => false);
            if (ok !== false) success++;
            else failed++;
        }

        return client.util.container(message, `# Mass Unban Complete\n-# Unbanned: **${success}** | Failed: **${failed}** | Total: **${bans.size}**`);
    },
};
