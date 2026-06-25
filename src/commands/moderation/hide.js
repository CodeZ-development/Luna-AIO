module.exports = {
    name: "hide",
    aliases: ["hc"],
    category: "moderation",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("ManageChannels")) {
            return client.util.container(message, `# Access Denied\n-# You need **Manage Channels** permission.`);
        }

        const channel = message.mentions.channels.first() ?? message.channel;
        const reason  = args.filter((a) => !a.startsWith("<#")).join(" ") || "No reason provided";

        await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            ViewChannel: false,
        }, { reason: `[Luna] ${reason} | Hidden by ${message.author.tag}` });

        return client.util.container(message, `# Channel Hidden\n-# ${channel} is now hidden from @everyone.\n-# Use \`unhide\` to restore visibility.`);
    },
};
