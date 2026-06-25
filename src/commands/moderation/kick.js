module.exports = {
    name: "kick",
    aliases: ["k"],
    category: "moderation",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("KickMembers")) {
            return client.util.container(message, `# Access Denied\n-# You need **Kick Members** permission.`);
        }

        const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
        if (!target) return client.util.container(message, `# User Not Found\n-# Usage: \`${message.guild.prefix || "?"}kick @user [reason]\``);
        if (target.id === message.author.id) return client.util.container(message, `# Error\n-# You cannot kick yourself.`);
        if (!target.kickable) return client.util.container(message, `# Cannot Kick\n-# Luna cannot kick that user.`);
        if (target.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return client.util.container(message, `# Cannot Kick\n-# That user has a higher or equal role to you.`);
        }

        const reason = args.slice(1).join(" ") || "No reason provided";
        await target.kick(`[Luna] ${reason} | Kicked by ${message.author.tag}`);

        return client.util.container(message, `# Kicked\n-# **${target.user.tag}** has been kicked.\n-# Reason: ${reason}`);
    },
};
