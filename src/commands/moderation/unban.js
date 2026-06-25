module.exports = {
    name: "unban",
    aliases: ["ub"],
    category: "moderation",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("BanMembers")) {
            return client.util.container(message, `# Access Denied\n-# You need **Ban Members** permission.`);
        }

        const userId = args[0]?.replace(/[<@!>]/g, "");
        if (!userId) return client.util.container(message, `# No User Provided\n-# Usage: \`${message.guild.prefix || "?"}unban <user_id> [reason]\``);

        const ban = await message.guild.bans.fetch(userId).catch(() => null);
        if (!ban) return client.util.container(message, `# Not Banned\n-# User \`${userId}\` is not banned.`);

        const reason = args.slice(1).join(" ") || "No reason provided";
        await message.guild.members.unban(userId, `[Luna] ${reason} | Unbanned by ${message.author.tag}`);

        return client.util.container(message, `# Unbanned\n-# **${ban.user.tag}** has been unbanned.\n-# Reason: ${reason}`);
    },
};
