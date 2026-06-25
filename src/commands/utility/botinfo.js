const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
const os    = require("os");
const emoji = require("../../core/emoji");

module.exports = {
    name: "botinfo",
    aliases: ["bi", "about", "info"],
    category: "utility",
    cooldown: 5,

    run: async (client, message) => {
        const ms     = client.uptime;
        const s      = Math.floor(ms / 1000);
        const m      = Math.floor(s / 60);
        const h      = Math.floor(m / 60);
        const d      = Math.floor(h / 24);
        const uptStr =
            (d > 0 ? `${d}d ` : "") +
            (h % 24 > 0 ? `${h % 24}h ` : "") +
            (m % 60 > 0 ? `${m % 60}m ` : "") +
            `${s % 60}s`;

        const cmdCount  = client.util.countCommands();
        const guilds    = client.guilds.cache.size;
        const users     = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
        const totalCmds = client.cmd.prepare("SELECT count FROM total_command_count WHERE id = 1").get()?.count ?? 0;
        const memUsage  = client.util.formatBytes(process.memoryUsage().heapUsed);

        const container = new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## Luna\n-# Powerful Anti-Nuke & Security Bot\n-# Developed by **CodeZ devs & Void**`,
                    ))
                    .setThumbnailAccessory(new ThumbnailBuilder({
                        media: { url: client.user.displayAvatarURL({ extension: "png", size: 1024 }) },
                    })),
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `${emoji.server} **Guilds** ${guilds.toLocaleString()}\n` +
                `${emoji.member} **Users** ${users.toLocaleString()}\n` +
                `${emoji.settings} **Commands** ${cmdCount}\n` +
                `${emoji.stats} **Commands Used** ${Number(totalCmds).toLocaleString()}\n` +
                `${emoji.dot} **Uptime** ${uptStr}\n` +
                `${emoji.dot} **Memory** ${memUsage}\n` +
                `${emoji.dot} **Node.js** ${process.version}\n` +
                `${emoji.dot} **Discord.js** v${require("discord.js").version}`,
            ))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `**Website:** razebot.site\n**Support:** discord.gg/codez\n**Invite:** Use \`${message.guild.prefix || "?"}invite\``,
            ));

        return message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
    },
};
