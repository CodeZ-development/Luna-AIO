module.exports = {
    name: "mute",
    aliases: ["timeout", "to"],
    category: "moderation",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("ModerateMembers")) {
            return client.util.container(message, `# Access Denied\n-# You need **Moderate Members** permission.`);
        }

        const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
        if (!target) return client.util.container(message, `# User Not Found\n-# Usage: \`${message.guild.prefix || "?"}mute @user <duration> [reason]\`\n-# Duration: 1m, 1h, 1d, 1w (max 28d)`);

        const durationStr = args[1];
        if (!durationStr) return client.util.container(message, `# No Duration\n-# Provide a duration. Examples: \`10m\`, \`1h\`, \`1d\``);

        const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
        const match = durationStr.match(/^(\d+)([smhdw])$/i);
        if (!match) return client.util.container(message, `# Invalid Duration\n-# Valid units: s, m, h, d, w. Example: \`30m\``);

        const ms = parseInt(match[1]) * units[match[2].toLowerCase()];
        const MAX = 28 * 86_400_000;
        if (ms > MAX) return client.util.container(message, `# Duration Too Long\n-# Maximum timeout duration is 28 days.`);

        if (!target.moderatable) return client.util.container(message, `# Cannot Mute\n-# Luna cannot timeout that user.`);

        const reason = args.slice(2).join(" ") || "No reason provided";
        await target.timeout(ms, `[Luna] ${reason} | Muted by ${message.author.tag}`);

        return client.util.container(message, `# Muted\n-# **${target.user.tag}** has been timed out for **${durationStr}**.\n-# Reason: ${reason}`);
    },
};
