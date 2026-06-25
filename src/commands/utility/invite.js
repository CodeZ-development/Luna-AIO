module.exports = {
    name: "invite",
    aliases: ["inv"],
    category: "utility",
    cooldown: 5,

    run: async (client, message) => {
        const link    = client.config.invite || `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`;
        const support = client.config.support;
        const website = client.config.website;

        return client.util.container(message,
            `## Invite Luna\n\n` +
            `**Invite Link:** [Click Here](${link})\n` +
            `**Support Server:** [discord.gg/codez](${support})\n` +
            `**Website:** [razebot.site](${website})\n\n` +
            `-# Luna — Powerful Anti-Nuke & Security Bot\n-# Developed by CodeZ devs & Void`,
        );
    },
};
