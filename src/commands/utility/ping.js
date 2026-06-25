const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    Routes,
} = require("discord.js");
const emoji = require("../../core/emoji");

module.exports = {
    name: "ping",
    aliases: ["pong", "latency"],
    category: "utility",
    cooldown: 5,

    run: async (client, message) => {
        const temp = await message.channel.send("...");
        const msgLatency = temp.createdTimestamp - message.createdTimestamp;
        const wsLatency  = client.ws.ping;

        let dbPing = null;
        try {
            if (typeof client.db?.ping === "function") {
                const raw = await client.db.ping();
                if (typeof raw === "number") dbPing = Number(raw.toFixed(2));
            }
        } catch {}

        let apiLatency = null;
        try {
            const t = Date.now();
            await client.rest.get(Routes.user(client.user.id));
            apiLatency = Date.now() - t;
        } catch {}

        const fmt = (v) => v === null ? "N/A" : `${Number(v).toFixed(0)}ms`;

        const container = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${emoji.ping} Pong!`))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `${emoji.dot} **Message** ${fmt(msgLatency)}\n` +
                `${emoji.dot} **WebSocket** ${fmt(wsLatency)}\n` +
                `${emoji.dot} **REST API** ${fmt(apiLatency)}\n` +
                `${emoji.dot} **Database** ${fmt(dbPing)}`,
            ))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Luna | razebot.site | discord.gg/codez`));

        await temp.edit({ content: null, flags: MessageFlags.IsComponentsV2, components: [container] });
        return temp;
    },
};
