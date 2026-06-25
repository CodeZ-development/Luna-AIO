const AntiNukeMemory = require("../../core/antinukeMemory");

module.exports = {
    name: "quarantineadd",
    aliases: ["qadd"],
    category: "security",
    cooldown: 3,

    run: async (client, message, args) => {
        const own   = message.author.id === message.guild.ownerId;
        const check = await client.util.isExtraOwner(message.author, message.guild);
        if (!own && !check) return client.util.container(message, `# Access Denied\n-# Only the server owner or an extra owner can manually quarantine users.`);

        const g = AntiNukeMemory.get(message.guild.id);
        if (!g?.enabled) return client.util.container(message, `# Antinuke Not Enabled\n-# Enable antinuke before using quarantine.`);

        const userId = message.mentions.users.first()?.id || args[0]?.replace(/[<@!>]/g, "");
        if (!userId) return client.util.container(message, `Usage: \`${message.guild.prefix || "?"}quarantineadd @user [reason]\``);

        const member = await message.guild.members.fetch(userId).catch(() => null);
        if (!member) return client.util.container(message, `# User Not Found\n-# That user is not in this server.`);
        if (member.id === message.guild.ownerId) return client.util.container(message, `# Cannot Quarantine\n-# You cannot quarantine the server owner.`);
        if (member.id === client.user.id) return client.util.container(message, `# Cannot Quarantine\n-# Luna cannot be quarantined.`);

        const reason = args.slice(1).join(" ") || "Manually quarantined by staff";

        await client.sntl.executeQuarantine(message.guild, g, member, reason);

        return client.util.container(message, `# Quarantined\n-# **${member.user.tag}** has been quarantined.\n-# Reason: ${reason}`);
    },
};
