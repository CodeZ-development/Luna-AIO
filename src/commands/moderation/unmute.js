module.exports = {
    name: "unmute",
    aliases: ["untimeout"],
    category: "moderation",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("ModerateMembers")) {
            return client.util.container(message, `# Access Denied\n-# You need **Moderate Members** permission.`);
        }

        const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
        if (!target) return client.util.container(message, `# User Not Found\n-# Usage: \`${message.guild.prefix || "?"}unmute @user\``);
        if (!target.communicationDisabledUntil) return client.util.container(message, `# Not Muted\n-# **${target.user.tag}** is not currently timed out.`);

        const reason = args.slice(1).join(" ") || "No reason provided";
        await target.timeout(null, `[Luna] ${reason} | Unmuted by ${message.author.tag}`);

        return client.util.container(message, `# Unmuted\n-# **${target.user.tag}** timeout has been removed.`);
    },
};
