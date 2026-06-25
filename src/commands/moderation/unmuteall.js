module.exports = {
    name: "unmuteall",
    aliases: ["masunmute"],
    category: "moderation",
    cooldown: 10,

    run: async (client, message) => {
        if (!message.member.permissions.has("ModerateMembers")) {
            return client.util.container(message, `# Access Denied\n-# You need **Moderate Members** permission.`);
        }

        const members = await message.guild.members.fetch().catch(() => null);
        if (!members) return client.util.container(message, `# Error\n-# Could not fetch members.`);

        const muted = members.filter((m) => m.communicationDisabledUntil && m.communicationDisabledUntil > new Date());
        if (!muted.size) return client.util.container(message, `# No Muted Members\n-# No currently timed-out members found.`);

        let success = 0;
        for (const [, member] of muted) {
            await member.timeout(null, `Mass unmute by ${message.author.tag}`).catch(() => {});
            success++;
        }

        return client.util.container(message, `# Mass Unmute Complete\n-# Removed timeout from **${success}** member${success !== 1 ? "s" : ""}.`);
    },
};
