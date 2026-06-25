module.exports = {
    name: "unlock",
    aliases: ["ul"],
    category: "moderation",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("ManageChannels")) {
            return client.util.container(message, `# Access Denied\n-# You need **Manage Channels** permission.`);
        }

        const channel = message.mentions.channels.first() ?? message.channel;
        const reason  = args.filter((a) => !a.startsWith("<#")).join(" ") || "No reason provided";

        await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: null,
        }, { reason: `[Luna] ${reason} | Unlock by ${message.author.tag}` });

        return client.util.container(message, `# Unlocked\n-# ${channel} has been unlocked.`);
    },
};
