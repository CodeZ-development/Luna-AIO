"use strict";

const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const CATS = {
    security: {
        label: "Security",
        cmds: [
            ["antinuke",      "Configure server protection"],
            ["whitelist",     "Trusted users bypass"],
            ["extraowner",    "Co-owner management"],
            ["quarantine",    "View / manage quarantine"],
            ["quarantineadd", "Manually quarantine a user"],
            ["roleprotect",   "Protect roles from deletion"],
            ["security",      "Run a security scan"],
            ["checkantinuke", "Quick antinuke status"],
        ],
    },
    moderation: {
        label: "Moderation",
        cmds: [
            ["ban",       "Ban a member"],
            ["kick",      "Kick a member"],
            ["mute",      "Timeout a member"],
            ["unmute",    "Remove timeout"],
            ["unban",     "Unban by ID"],
            ["unbanall",  "Mass unban all"],
            ["unmuteall", "Remove all timeouts"],
            ["purge",     "Bulk delete messages"],
            ["lock",      "Lock a channel"],
            ["unlock",    "Unlock a channel"],
            ["hide",      "Hide a channel"],
            ["unhide",    "Unhide a channel"],
            ["warn",      "Warn a member"],
            ["nick",      "Change nickname"],
            ["role",      "Add / remove role"],
            ["snipe",     "Last deleted message"],
            ["inspect",   "User info + security data"],
            ["list",      "List admins / bots / roles"],
            ["autorole",  "Auto assign roles on join"],
            ["prefix",    "Change server prefix"],
        ],
    },
    utility: {
        label: "Utility",
        cmds: [
            ["ping",        "Bot latency"],
            ["uptime",      "Bot uptime"],
            ["botinfo",     "Bot stats"],
            ["serverinfo",  "Server info"],
            ["roleinfo",    "Role info"],
            ["channelinfo", "Channel info"],
            ["avatar",      "Get avatar"],
            ["invite",      "Bot invite link"],
            ["help",        "This menu"],
        ],
    },
    automod: {
        label: "Automod",
        cmds: [
            ["automod antilink",   "Block external links"],
            ["automod antiinvite", "Block Discord invites"],
            ["automod antispam",   "Limit message spam"],
            ["automod badwords",   "Badword filter"],
            ["automod action",     "Set violation action"],
            ["automod status",     "View config"],
        ],
    },
    system: {
        label: "System",
        cmds: [
            ["eval",        "Run code"],
            ["blacklist",   "Block users / servers"],
            ["noprefix",    "No-prefix access"],
            ["maintenance", "Toggle maintenance mode"],
            ["servers",     "List all servers"],
            ["dm",          "DM a user as the bot"],
            ["say",         "Speak in a channel"],
            ["leave",       "Leave a server"],
            ["reload",      "Reload a command"],
        ],
    },
};

const SELECT_OPTIONS = Object.entries(CATS).map(([key, cat]) => ({
    label:       cat.label,
    value:       key,
    description: `${cat.cmds.length} commands`,
}));

const LINK_ROW = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setLabel("Website")
        .setStyle(ButtonStyle.Link)
        .setURL("https://razebot.site"),
    new ButtonBuilder()
        .setLabel("Support")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/codez"),
);

module.exports = {
    name: "help",
    aliases: ["h", "cmds"],
    category: "utility",
    cooldown: 3,

    run: async (client, message, args) => {
        const p   = message.guild.prefix || "?";
        const arg = args[0]?.toLowerCase();

        if (arg) {
            const cmd = client.commands.get(arg) || client.commands.get(client.aliases?.get(arg));
            if (!cmd) {
                return client.util.container(message,
                    `## Command not found\n-# No command named \`${arg}\`.\n-# Run \`${p}help\` to browse all commands.`,
                );
            }
            const aliases = cmd.aliases?.length
                ? cmd.aliases.map((a) => `\`${a}\``).join(", ")
                : "none";
            return client.util.container(message,
                `## ${p}${cmd.name}\n` +
                `-# ${cmd.category ?? "utility"}\n\n` +
                `**Aliases** ${aliases}\n` +
                `**Cooldown** ${cmd.cooldown ?? 5}s\n` +
                `**Owner only** ${cmd.ownerOnly ? "yes" : "no"}`,
            );
        }

        const overview = Object.entries(CATS)
            .map(([, cat]) => `**${cat.label}** — ${cat.cmds.length} commands`)
            .join("\n");

        const container = new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## Luna\n-# prefix \`${p}\` — select a category below`,
                    ))
                    .setThumbnailAccessory(new ThumbnailBuilder({
                        media: { url: client.user.displayAvatarURL({ extension: "png", size: 256 }) },
                    })),
            )
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(overview))
            .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `-# CodeZ devs & Void`,
            ))
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("help_cat")
                        .setPlaceholder("Select a category")
                        .addOptions(SELECT_OPTIONS),
                ),
            )
            .addActionRowComponents(LINK_ROW);

        const msg = await message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });

        const col = msg.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time:   90_000,
        });

        col.on("collect", async (i) => {
            if (i.customId !== "help_cat") return i.deferUpdate();

            const cat  = CATS[i.values[0]];
            const list = cat.cmds.map(([name, desc]) => `\`${p}${name}\` — ${desc}`).join("\n");

            const updated = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## ${cat.label}\n\n${list}`,
                ))
                .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `-# \`${p}help <command>\` for usage`,
                ))
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId("help_cat")
                            .setPlaceholder("Select a category")
                            .addOptions(SELECT_OPTIONS),
                    ),
                )
                .addActionRowComponents(LINK_ROW);

            await i.update({ flags: MessageFlags.IsComponentsV2, components: [updated] });
        });

        col.on("end", () => {
            msg.edit({
                flags: MessageFlags.IsComponentsV2,
                components: [
                    new ContainerBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `-# Session expired — run \`${p}help\` again.`,
                        ),
                    ),
                ],
            }).catch(() => {});
        });
    },
};
