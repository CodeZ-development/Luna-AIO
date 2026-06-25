module.exports = {
    name: "nick",
    aliases: ["setnick", "nickname"],
    category: "moderation",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("ManageNicknames")) {
            return client.util.container(message, `# Access Denied\n-# You need **Manage Nicknames** permission.`);
        }

        const target = message.mentions.members.first();
        if (!target) return client.util.container(message, `Usage: \`${message.guild.prefix || "?"}nick @user [new nickname]\``);

        const nick = args.slice(1).join(" ") || null;

        if (target.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return client.util.container(message, `# Cannot Change\n-# That user has a higher or equal role to you.`);
        }

        await target.setNickname(nick, `Changed by ${message.author.tag}`);

        return client.util.container(message, nick
            ? `# Nickname Set\n-# **${target.user.tag}**'s nickname set to **${nick}**.`
            : `# Nickname Reset\n-# **${target.user.tag}**'s nickname has been reset.`);
    },
};
