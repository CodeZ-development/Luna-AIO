module.exports = {
    name: "uptime",
    aliases: ["up"],
    category: "utility",
    cooldown: 5,

    run: async (client, message) => {
        const ms    = client.uptime;
        const s     = Math.floor(ms / 1000);
        const m     = Math.floor(s / 60);
        const h     = Math.floor(m / 60);
        const d     = Math.floor(h / 24);
        const text  =
            (d > 0 ? `${d}d ` : "") +
            (h % 24 > 0 ? `${h % 24}h ` : "") +
            (m % 60 > 0 ? `${m % 60}m ` : "") +
            `${s % 60}s`;

        const startTs = Math.floor((Date.now() - ms) / 1000);

        return client.util.container(message,
            `## Luna — Uptime\n\n` +
            `**Running for:** ${text}\n` +
            `**Started:** <t:${startTs}:F>`,
        );
    },
};
