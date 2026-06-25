module.exports = {
    name: "ban",
    aliases: ["b"],
    category: "moderation",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("BanMembers")) {
            return client.util.container(message, `# Access Denied\n-# You need **Ban Members** permission.`);
        }

        const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
        if (!target) return client.util.container(message, `# User Not Found\n-# Mention a user or provide their ID.\n-# Usage: \`${message.guild.prefix || "?"}ban @user [reason]\``);
        if (target.id === message.author.id) return client.util.container(message, `# Error\n-# You cannot ban yourself.`);
        if (!target.bannable) return client.util.container(message, `# Cannot Ban\n-# Luna cannot ban that user — check role hierarchy.`);
        if (target.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return client.util.container(message, `# Cannot Ban\n-# That user has a higher or equal role to you.`);
        }

        const reason = args.slice(1).join(" ") || "No reason provided";
        await target.ban({ reason: `[Luna] ${reason} | Banned by ${message.author.tag}`, deleteMessageSeconds: 0 });

        return client.util.container(message, `# Banned\n-# **${target.user.tag}** has been banned.\n-# Reason: ${reason}`);
    },
};
