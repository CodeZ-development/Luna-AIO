module.exports = {
    name: "unhide",
    aliases: ["uhc"],
    category: "moderation",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("ManageChannels")) {
            return client.util.container(message, `# Access Denied\n-# You need **Manage Channels** permission.`);
        }

        const channel = message.mentions.channels.first() ?? message.channel;

        await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            ViewChannel: null,
        }, { reason: `Unhidden by ${message.author.tag}` });

        return client.util.container(message, `# Channel Visible\n-# ${channel} has been made visible again.`);
    },
};
