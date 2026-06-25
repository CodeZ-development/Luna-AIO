const {
    PermissionFlagsBits,
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const Antinuke          = require("../../models/antinuke.js");
const AntiNukeMemory    = require("../../core/antinukeMemory");
const { updateGuildAntiNuke } = require("../../core/loadAntiNuke");
const emoji             = require("../../core/emoji");

const MODULE_DEFINITIONS = [
    { key: "antiban",         label: "Ban Protection",         description: "Punish unauthorized member bans" },
    { key: "antiunban",       label: "Unban Protection",       description: "Punish unauthorized member unbans" },
    { key: "antikick",        label: "Kick Protection",        description: "Punish unauthorized member kicks" },
    { key: "antibotadd",      label: "Bot Add Protection",     description: "Remove unauthorized bots" },
    { key: "antichannel",     label: "Channel Protection",     description: "Protect channel create, delete, update" },
    { key: "antirole",        label: "Role Protection",        description: "Protect role create, delete, update" },
    { key: "antiwebhook",     label: "Webhook Protection",     description: "Protect webhook create and update" },
    { key: "antiserver",      label: "Server Protection",      description: "Protect guild setting changes" },
    { key: "antiemoji",       label: "Emoji Protection",       description: "Protect emoji create and delete" },
    { key: "antisticker",     label: "Sticker Protection",     description: "Protect sticker create and delete" },
    { key: "antiintegration", label: "Integration Protection", description: "Protect integration create and delete" },
    { key: "antithread",      label: "Thread Protection",      description: "Protect thread deletion" },
    { key: "antimention",     label: "Mention Protection",     description: "Protect mass @everyone and role mentions" },
    { key: "antilink",        label: "Linked Role Protection", description: "Strip dangerous perms from linked roles" },
];

const DEFAULT_THRESHOLDS = { ban: 3, kick: 3, channel: 4, role: 4, botadd: 2, mention: 3, unban: 3, webhook: 3 };

function readModuleState(anti) {
    const state = {};
    for (const m of MODULE_DEFINITIONS) state[m.key] = anti?.enabledmodules?.[m.key] !== false;
    return state;
}

function chunkText(text, limit = 3900) {
    if (text.length <= limit) return text;
    return text.slice(0, limit - 30) + "\n-# Output trimmed.";
}

function roleLabel(guild, roleId) {
    const role = roleId ? guild.roles.cache.get(roleId) : null;
    return role ? `${role} | \`${role.id}\`` : roleId ? `Missing | \`${roleId}\`` : "Not set";
}

module.exports = {
    name: "antinuke",
    aliases: ["an", "antiwizz"],
    category: "security",
    cooldown: 3,

    run: async (client, message, args) => {
        const own   = message.author.id === message.guild.ownerId;
        const check = await client.util.isExtraOwner(message.author, message.guild);

        if (!own && !check) {
            return client.util.container(message, `# Access Denied\n-# Only the server owner or an extra owner can run this command.`);
        }

        const prefix = message.guild.prefix || "?";
        const option = args[0]?.toLowerCase();
        const anti   = await Antinuke.findById(message.guild.id).lean();
        const isEnabled = anti?.enabled === true;

        switch (option) {
            case "enable": {
                if (isEnabled) return client.util.container(message, `# Already Enabled\n-# Protection is already active on **${message.guild.name}**.\n-# Use \`${prefix}antinuke disable\` to turn it off.`);

                if (message.guild.roles.cache.size > 249) {
                    return client.util.container(message, `# Cannot Enable\n-# This server has 250 roles. Delete one before enabling.`);
                }

                const botPos     = message.guild.members.me.roles.highest.position;
                const unbypassRole = await message.guild.roles.create({
                    name: `Luna unbypass`,
                    position: botPos,
                    reason: `Luna antinuke unbypass role`,
                    permissions: [PermissionFlagsBits.Administrator],
                });

                await Antinuke.updateOne(
                    { _id: message.guild.id },
                    { $set: { enabled: true, unbypassRoleId: unbypassRole.id } },
                    { upsert: true },
                );
                await updateGuildAntiNuke(message.guild.id);
                await message.guild.members.me.roles.add(unbypassRole.id).catch(() => {});

                return client.util.container(message, `# Antinuke Enabled\n-# Protection is now active on **${message.guild.name}**.\n-# Run \`${prefix}antinuke modules\` to configure protection modules.`);
            }

            case "disable": {
                if (!isEnabled) return client.util.container(message, `# Not Enabled\n-# Use \`${prefix}antinuke enable\` first.`);

                await Antinuke.updateOne({ _id: message.guild.id }, { $set: { enabled: false } }, { upsert: true });
                await updateGuildAntiNuke(message.guild.id);

                if (anti?.unbypassRoleId) {
                    const role = message.guild.roles.cache.get(anti.unbypassRoleId);
                    if (role) await role.delete("Luna: Antinuke disabled").catch(() => {});
                }

                return client.util.container(message, `# Antinuke Disabled\n-# Protection has been turned off for **${message.guild.name}**.`);
            }

            case "config": {
                return configPanel(client, message, anti, prefix);
            }

            case "module":
            case "modules": {
                if (!isEnabled) return client.util.container(message, `# Not Enabled\n-# Run \`${prefix}antinuke enable\` first.`);
                return modulesPanel(client, message, anti, prefix);
            }

            case "status": {
                return antinukeStatus(client, message, anti);
            }

            case "repair": {
                if (!isEnabled) return client.util.container(message, `# Not Enabled\n-# Run \`${prefix}antinuke enable\` first.`);
                return antinukeRepair(client, message);
            }

            case "audit": {
                return antinukeAudit(client, message, args.slice(1));
            }

            case "logs":
            case "log": {
                if (!isEnabled) return client.util.container(message, `# Not Enabled\n-# Run \`${prefix}antinuke enable\` first.`);
                return antinukeLogs(client, message, args.slice(1));
            }

            case "backup": {
                if (!isEnabled) return client.util.container(message, `# Not Enabled\n-# Run \`${prefix}antinuke enable\` first.`);
                return antinukeBackup(client, message);
            }

            case "restore": {
                if (!isEnabled) return client.util.container(message, `# Not Enabled\n-# Run \`${prefix}antinuke enable\` first.`);
                return antinukeRestore(client, message);
            }

            case "punishment":
            case "punish": {
                if (!isEnabled) return client.util.container(message, `# Not Enabled\n-# Run \`${prefix}antinuke enable\` first.`);
                return antinukePunishment(client, message, args.slice(1));
            }

            case "notify": {
                if (!isEnabled) return client.util.container(message, `# Not Enabled\n-# Run \`${prefix}antinuke enable\` first.`);
                return antinukeNotify(client, message, args.slice(1));
            }

            case "threshold": {
                if (!own) return client.util.container(message, `# Access Denied\n-# Only the server owner can configure thresholds.`);
                if (!isEnabled) return client.util.container(message, `# Not Enabled\n-# Run \`${prefix}antinuke enable\` first.`);
                return antinukeThreshold(client, message, args.slice(1));
            }

            case "resetconfig": {
                if (!own) return client.util.container(message, `# Access Denied\n-# Only the server owner can reset the configuration.`);
                return antinukeResetConfig(client, message);
            }

            case "panic": {
                if (!isEnabled) return client.util.container(message, `# Not Enabled\n-# Run \`${prefix}antinuke enable\` first.`);
                return antinukePanic(client, message, args.slice(1), anti, own);
            }

            default: {
                return antinukeHelp(client, message, isEnabled, prefix);
            }
        }
    },
};

async function antinukeHelp(client, message, isEnabled, prefix) {
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `# Luna — Antinuke\n-# Status: **${isEnabled ? "Active" : "Inactive"}**`,
    ));

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `### Core Commands\n` +
                `\`${prefix}antinuke enable\` — Enable protection\n` +
                `\`${prefix}antinuke disable\` — Disable protection\n` +
                `\`${prefix}antinuke config\` — Configure settings\n` +
                `\`${prefix}antinuke modules\` — Toggle protection modules\n` +
                `\`${prefix}antinuke status\` — View current status\n` +
                `\`${prefix}antinuke audit @user\` — Security audit`,
            ))
            .setThumbnailAccessory(new ThumbnailBuilder({
                media: { url: message.author.displayAvatarURL({ extension: "png", size: 1024 }) },
            })),
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `### Configuration Commands\n` +
        `\`${prefix}antinuke punishment <ban|kick|quarantine>\` — Set punishment type\n` +
        `\`${prefix}antinuke threshold <module> <number>\` — Set action threshold\n` +
        `\`${prefix}antinuke notify <on|off>\` — Toggle owner DM notifications\n` +
        `\`${prefix}antinuke logs #channel\` — Set log channel\n` +
        `\`${prefix}antinuke backup\` — Backup roles and channels\n` +
        `\`${prefix}antinuke restore\` — Restore from backup\n` +
        `\`${prefix}antinuke panic\` — Panic mode controls\n` +
        `\`${prefix}antinuke repair\` — Repair security roles\n` +
        `\`${prefix}antinuke resetconfig\` — Reset all configuration\n` +
        `\n` +
        `\`${prefix}extraowner\` — Manage extra owners\n` +
        `\`${prefix}whitelist\` — Manage whitelist`,
    ));

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `-# Luna | discord.gg/codez | razebot.site`,
    ));

    return message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
}

async function configPanel(client, message, anti, prefix) {
    const g = AntiNukeMemory.get(message.guild.id);
    const punishment = anti?.punishment || g?.punishment || "ban";
    const logChannel = anti?.logChannel ? `<#${anti.logChannel}>` : "Not set";
    const notifyowners = anti?.notifyowners !== false ? "On" : "Off";

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Antinuke — Configuration`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**Punishment:** \`${punishment}\`\n` +
        `**Log Channel:** ${logChannel}\n` +
        `**Owner Notifications:** \`${notifyowners}\`\n` +
        `**Status:** ${anti?.enabled ? "Active" : "Inactive"}`,
    ));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `Use the commands below to change settings:\n` +
        `\`${prefix}antinuke punishment ban|kick|quarantine\`\n` +
        `\`${prefix}antinuke logs #channel\`\n` +
        `\`${prefix}antinuke notify on|off\`\n` +
        `\`${prefix}antinuke threshold <module> <1-10>\``,
    ));

    const punishRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("an_ban").setLabel("Ban").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("an_kick").setLabel("Kick").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("an_quarantine").setLabel("Quarantine").setStyle(ButtonStyle.Secondary),
    );
    container.addActionRowComponents(punishRow);

    const msg = await message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });

    const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        time: 60_000,
    });

    collector.on("collect", async (i) => {
        const punishMap = { an_ban: "ban", an_kick: "kick", an_quarantine: "quarantine" };
        const newPunishment = punishMap[i.customId];
        if (!newPunishment) return i.deferUpdate();

        await Antinuke.updateOne({ _id: message.guild.id }, { $set: { punishment: newPunishment } }, { upsert: true });
        await updateGuildAntiNuke(message.guild.id);

        const updatedContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `# Antinuke — Configuration\n\n**Punishment updated to:** \`${newPunishment}\``,
            ));

        await i.update({ flags: MessageFlags.IsComponentsV2, components: [updatedContainer] });
        collector.stop();
    });
}

async function modulesPanel(client, message, anti, prefix) {
    const state = readModuleState(anti);

    const options = MODULE_DEFINITIONS.map((m) => ({
        label:       m.label,
        value:       m.key,
        description: m.description,
    }));

    const statusLines = MODULE_DEFINITIONS.map((m) => `- **${m.label}:** ${state[m.key] !== false ? "On" : "Off"}`).join("\n");

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Antinuke — Modules`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(statusLines));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("an_module_select")
                .setPlaceholder("Select a module to toggle")
                .addOptions(options)
                .setMinValues(1)
                .setMaxValues(1),
        ),
    );
    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("an_all_on").setLabel("Enable All").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("an_all_off").setLabel("Disable All").setStyle(ButtonStyle.Secondary),
        ),
    );

    const msg = await message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });

    const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        time: 120_000,
    });

    collector.on("collect", async (i) => {
        if (i.customId === "an_all_on" || i.customId === "an_all_off") {
            const val = i.customId === "an_all_on";
            const update = {};
            for (const m of MODULE_DEFINITIONS) update[`enabledmodules.${m.key}`] = val;
            await Antinuke.updateOne({ _id: message.guild.id }, { $set: update }, { upsert: true });
            await updateGuildAntiNuke(message.guild.id);
            const updatedAnti = await Antinuke.findById(message.guild.id).lean();
            const newState    = readModuleState(updatedAnti);
            const newLines    = MODULE_DEFINITIONS.map((m) => `- **${m.label}:** ${newState[m.key] !== false ? "On" : "Off"}`).join("\n");
            const c = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Antinuke — Modules\n\nAll modules ${val ? "enabled" : "disabled"}.\n\n${newLines}`));
            return i.update({ flags: MessageFlags.IsComponentsV2, components: [c] });
        }

        if (i.customId === "an_module_select") {
            const key = i.values[0];
            const current = (await Antinuke.findById(message.guild.id).lean())?.enabledmodules?.[key] !== false;
            const newVal  = !current;
            await Antinuke.updateOne({ _id: message.guild.id }, { $set: { [`enabledmodules.${key}`]: newVal } }, { upsert: true });
            await updateGuildAntiNuke(message.guild.id);
            const label = MODULE_DEFINITIONS.find((m) => m.key === key)?.label ?? key;
            const c = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `# Antinuke — Modules\n\n**${label}** is now **${newVal ? "On" : "Off"}**.`,
            ));
            return i.update({ flags: MessageFlags.IsComponentsV2, components: [c] });
        }
    });
}

async function antinukeStatus(client, message, anti) {
    const g = AntiNukeMemory.get(message.guild.id);
    const state = g?.modules || readModuleState(anti);

    const moduleLines = MODULE_DEFINITIONS.map((m) => `- **${m.label}:** ${state[m.key] !== false ? "On" : "Off"}`).join("\n");
    const thresholds  = anti?.thresholds ? [...Object.entries(anti.thresholds)].map(([k, v]) => `  ${k}: ${v}`).join("\n") : "  All at default";

    const text =
        `# Antinuke — Status\n` +
        `**Enabled:** ${anti?.enabled ? "Yes" : "No"}\n` +
        `**Punishment:** ${anti?.punishment || g?.punishment || "ban"}\n` +
        `**Log Channel:** ${anti?.logChannel ? `<#${anti.logChannel}>` : "Not set"}\n` +
        `**Owner Notifications:** ${anti?.notifyowners !== false ? "On" : "Off"}\n` +
        `**Unbypass Role:** ${roleLabel(message.guild, anti?.unbypassRoleId || g?.unbypassRoleId)}\n` +
        `**Quarantine Role:** ${roleLabel(message.guild, anti?.quarantineroleid || g?.quarantineRoleId)}\n` +
        `**Panic Mode:** ${anti?.panic || g?.panic ? "Active" : "Inactive"}\n` +
        `**Whitelist Entries:** ${g?.whitelist?.size ?? Object.keys(anti?.whitelist || {}).length}\n` +
        `**Extra Owners:** ${g?.extraOwners?.size ?? anti?.extraowner?.length ?? 0}\n` +
        `**Protected Roles:** ${g?.protectedRoles?.size ?? anti?.protectedRoles?.length ?? 0}\n` +
        `**Thresholds:**\n${thresholds}\n\n` +
        `## Modules\n${moduleLines}`;

    return client.util.container(message, chunkText(text));
}

async function antinukeRepair(client, message) {
    let g = AntiNukeMemory.get(message.guild.id);
    if (!g) {
        await updateGuildAntiNuke(message.guild.id);
        g = AntiNukeMemory.get(message.guild.id);
    }
    if (!g) return client.util.container(message, `# Repair Failed\n-# Antinuke cache could not be loaded.`);

    const actions = [];

    const unbypassRole = g.unbypassRoleId ? await message.guild.roles.fetch(g.unbypassRoleId).catch(() => null) : null;
    if (!unbypassRole) {
        const role = await client.sntl.unbypassroledelete(message.guild, g);
        actions.push(role ? `- Recreated unbypass role: ${role}` : `- Failed to recreate unbypass role`);
    } else {
        actions.push(`- Unbypass role exists`);
        if (!message.guild.members.me.roles.cache.has(unbypassRole.id)) {
            await message.guild.members.me.roles.add(unbypassRole.id, "Luna repair").catch(() => null);
            actions.push(`- Reattached unbypass role to Luna`);
        }
    }

    const quarantineReady = await client.sntl.handlequarantine(message.guild);
    actions.push(quarantineReady ? `- Quarantine role verified` : `- Failed to repair quarantine role`);

    await updateGuildAntiNuke(message.guild.id);
    actions.push(`- Antinuke cache reloaded`);

    return client.util.container(message, `# Antinuke — Repair\n${actions.join("\n")}`);
}

async function antinukeAudit(client, message, args) {
    const userId = message.mentions.users.first()?.id || args[0]?.replace(/[<@!>]/g, "");
    if (!userId) return client.util.container(message, `# Antinuke Audit\n-# Usage: \`${message.guild.prefix || "?"}antinuke audit @user\``);

    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (!member) return client.util.container(message, `# User Not Found\n-# Could not find that user in this server.`);

    const g = AntiNukeMemory.get(message.guild.id);
    const dangerousRoles = member.roles.cache
        .filter((r) => r.id !== message.guild.id && r.permissions.has(PermissionFlagsBits.Administrator))
        .map((r) => `  ${r} | \`${r.id}\``);

    const lines = [
        `# Antinuke Audit`,
        `**User:** ${member.user.tag} | \`${member.id}\``,
        `**Server Owner:** ${member.id === message.guild.ownerId ? "Yes" : "No"}`,
        `**Extra Owner:** ${g?.extraOwners?.has(member.id) ? "Yes" : "No"}`,
        `**Whitelisted:** ${g?.whitelist?.has(member.id) ? "Yes" : "No"}`,
        `**Panic Role Bypass:** ${g?.panicWhitelistRoles && member.roles.cache.some((r) => g.panicWhitelistRoles.has(r.id)) ? "Yes" : "No"}`,
        `**Has Administrator:** ${member.permissions.has(PermissionFlagsBits.Administrator) ? "Yes" : "No"}`,
        `**Account Age:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
        ``,
        `## Administrator Roles`,
        dangerousRoles.length ? dangerousRoles.join("\n") : "None",
    ];

    return client.util.container(message, chunkText(lines.join("\n")));
}

async function antinukeLogs(client, message, args) {
    const channel = message.mentions.channels.first() ||
        (args[0] ? await message.guild.channels.fetch(args[0]).catch(() => null) : null);

    if (!channel?.isTextBased()) {
        return client.util.container(message, `# Invalid Channel\n-# Usage: \`${message.guild.prefix || "?"}antinuke logs #channel\``);
    }

    await Antinuke.updateOne({ _id: message.guild.id }, { $set: { logChannel: channel.id } }, { upsert: true });
    await updateGuildAntiNuke(message.guild.id);

    return client.util.container(message, `# Log Channel Set\n-# Antinuke logs will be sent to ${channel}.`);
}

async function antinukePunishment(client, message, args) {
    const valid = ["ban", "kick", "quarantine"];
    const choice = args[0]?.toLowerCase();

    if (!choice || !valid.includes(choice)) {
        return client.util.container(message, `# Invalid Punishment\n-# Valid options: \`ban\`, \`kick\`, \`quarantine\`\n-# Usage: \`${message.guild.prefix || "?"}antinuke punishment ban\``);
    }

    await Antinuke.updateOne({ _id: message.guild.id }, { $set: { punishment: choice } }, { upsert: true });
    await updateGuildAntiNuke(message.guild.id);

    return client.util.container(message, `# Punishment Updated\n-# Punishment type set to **${choice}**.`);
}

async function antinukeNotify(client, message, args) {
    const toggle = args[0]?.toLowerCase();
    if (!toggle || !["on", "off"].includes(toggle)) {
        return client.util.container(message, `# Invalid Option\n-# Usage: \`${message.guild.prefix || "?"}antinuke notify on|off\``);
    }

    const val = toggle === "on";
    await Antinuke.updateOne({ _id: message.guild.id }, { $set: { notifyowners: val } }, { upsert: true });
    await updateGuildAntiNuke(message.guild.id);

    return client.util.container(message, `# Notifications ${val ? "Enabled" : "Disabled"}\n-# Owner DM notifications are now **${val ? "on" : "off"}**.`);
}

async function antinukeThreshold(client, message, args) {
    const VALID_MODULES = ["ban", "kick", "channel", "role", "botadd", "mention", "unban", "webhook"];
    const moduleName = args[0]?.toLowerCase();
    const amount     = parseInt(args[1]);

    if (!moduleName || !VALID_MODULES.includes(moduleName)) {
        return client.util.container(message,
            `# Antinuke Threshold\n-# Set how many violations trigger panic mode.\n\n` +
            `**Valid modules:** ${VALID_MODULES.join(", ")}\n` +
            `**Usage:** \`${message.guild.prefix || "?"}antinuke threshold <module> <1-10>\`\n\n` +
            `**Defaults:**\n` +
            Object.entries(DEFAULT_THRESHOLDS).map(([k, v]) => `- ${k}: ${v}`).join("\n"),
        );
    }

    if (isNaN(amount) || amount < 1 || amount > 20) {
        return client.util.container(message, `# Invalid Amount\n-# Threshold must be between 1 and 20.`);
    }

    await Antinuke.updateOne(
        { _id: message.guild.id },
        { $set: { [`thresholds.${moduleName}`]: amount } },
        { upsert: true },
    );
    await updateGuildAntiNuke(message.guild.id);

    return client.util.container(message, `# Threshold Updated\n-# **${moduleName}** threshold set to **${amount}** actions per 10 seconds.`);
}

async function antinukeResetConfig(client, message) {
    await Antinuke.updateOne(
        { _id: message.guild.id },
        {
            $set: {
                punishment:    "ban",
                logChannel:    null,
                notifyowners:  true,
                thresholds:    {},
                enabledmodules: {},
                extraowner:    [],
                whitelist:     {},
                panic:         false,
                panicBackup:   {},
            },
        },
        { upsert: true },
    );
    await updateGuildAntiNuke(message.guild.id);

    return client.util.container(message, `# Configuration Reset\n-# All antinuke settings have been reset to defaults.\n-# The bot is still enabled. Use \`antinuke disable\` to fully turn it off.`);
}

function serializeOverwrites(channel) {
    if (!channel.permissionOverwrites?.cache) return [];
    return channel.permissionOverwrites.cache.map((o) => ({
        id: o.id, type: o.type,
        allow: o.allow.bitfield.toString(),
        deny:  o.deny.bitfield.toString(),
    }));
}

async function antinukeBackup(client, message) {
    const roles = message.guild.roles.cache.filter((r) => r.id !== message.guild.id).map((r) => ({
        id: r.id, name: r.name, permissions: r.permissions.bitfield.toString(),
        color: r.color, hoist: r.hoist, mentionable: r.mentionable, position: r.rawPosition,
    }));
    const channels = message.guild.channels.cache.map((c) => ({
        id: c.id, name: c.name, type: c.type, parentId: c.parentId,
        rawPosition: c.rawPosition, permissionOverwrites: serializeOverwrites(c),
    }));
    const backup = { createdAt: new Date().toISOString(), createdBy: message.author.id, roles, channels };

    await Antinuke.updateOne({ _id: message.guild.id }, { $set: { securityBackup: backup } }, { upsert: true });
    await updateGuildAntiNuke(message.guild.id);

    return client.util.container(message, `# Backup Saved\n-# Stored **${roles.length}** roles and **${channels.length}** channels.\n-# Use \`antinuke restore\` to apply this backup.`);
}

async function antinukeRestore(client, message) {
    const anti  = await Antinuke.findById(message.guild.id).lean();
    const backup = anti?.securityBackup;
    if (!backup) return client.util.container(message, `# No Backup Found\n-# Run \`antinuke backup\` first.`);

    let restoredRoles    = 0;
    let restoredChannels = 0;
    const botRole        = message.guild.members.me.roles.highest;

    for (const saved of backup.roles || []) {
        const role = await message.guild.roles.fetch(saved.id).catch(() => null);
        if (!role || role.position >= botRole.position) continue;
        await role.setPermissions(BigInt(saved.permissions), "Luna: Backup restore").catch(() => null);
        restoredRoles++;
    }

    for (const saved of backup.channels || []) {
        const channel = await message.guild.channels.fetch(saved.id).catch(() => null);
        if (!channel?.permissionOverwrites) continue;
        const overwrites = (saved.permissionOverwrites || []).map((o) => ({
            id: o.id, type: o.type, allow: BigInt(o.allow), deny: BigInt(o.deny),
        }));
        await channel.permissionOverwrites.set(overwrites, "Luna: Backup restore").catch(() => null);
        restoredChannels++;
    }

    await updateGuildAntiNuke(message.guild.id);
    return client.util.container(message, `# Backup Restored\n-# Restored **${restoredRoles}** roles and **${restoredChannels}** channel permission sets.`);
}

async function antinukePanic(client, message, args, anti, own) {
    const sub    = args[0]?.toLowerCase();
    const prefix = message.guild.prefix || "?";
    const g      = AntiNukeMemory.get(message.guild.id);

    if (sub === "enable") {
        if (!own) return client.util.container(message, `# Access Denied\n-# Only the server owner can enable panic mode.`);
        if (!g) return client.util.container(message, `# Data Error\n-# Antinuke cache not found. Run \`antinuke repair\`.`);
        await client.sntl.activatePanicMode(message.guild, g);
        return client.util.container(message, `# Panic Mode Enabled\n-# All dangerous role permissions have been stripped.\n-# Use \`${prefix}antinuke panic disable\` to revert.`);
    }

    if (sub === "disable") {
        if (!anti?.panic && !g?.panic) return client.util.container(message, `# Not Active\n-# Panic mode is not currently active.`);
        if (!g) return client.util.container(message, `# Data Error\n-# Antinuke cache not found.`);
        await Antinuke.updateOne({ _id: message.guild.id }, { $set: { panic: false } }, { upsert: true });
        await updateGuildAntiNuke(message.guild.id);
        const restored = await client.sntl.restorePanicMode(message.guild, g);
        return client.util.container(message, restored ? `# Panic Mode Disabled\n-# All role permissions have been restored.` : `# Panic Mode Disabled\n-# No backup was found to restore from.`);
    }

    if (sub === "whitelist") {
        const roleId = args[1];
        if (!roleId) return client.util.container(message, `Usage: \`${prefix}antinuke panic whitelist <roleId>\``);
        const role = await message.guild.roles.fetch(roleId).catch(() => null);
        if (!role) return client.util.container(message, `# Invalid Role\n-# Could not find that role.`);
        await Antinuke.updateOne({ _id: message.guild.id }, { $addToSet: { panicWhitelistRoles: roleId } }, { upsert: true });
        await updateGuildAntiNuke(message.guild.id);
        return client.util.container(message, `# Role Whitelisted\n-# **${role.name}** will bypass panic mode.`);
    }

    if (sub === "unwhitelist") {
        const roleId = args[1];
        if (!roleId) return client.util.container(message, `Usage: \`${prefix}antinuke panic unwhitelist <roleId>\``);
        await Antinuke.updateOne({ _id: message.guild.id }, { $pull: { panicWhitelistRoles: roleId } }, { upsert: true });
        await updateGuildAntiNuke(message.guild.id);
        return client.util.container(message, `# Role Removed\n-# Role \`${roleId}\` removed from panic whitelist.`);
    }

    return client.util.container(message,
        `## Panic Mode Commands\n\n` +
        `\`${prefix}antinuke panic enable\` — Strip all dangerous permissions (Owner only)\n` +
        `\`${prefix}antinuke panic disable\` — Disable and restore permissions\n` +
        `\`${prefix}antinuke panic whitelist <roleId>\` — Whitelist a role from panic mode\n` +
        `\`${prefix}antinuke panic unwhitelist <roleId>\` — Remove role from whitelist`,
    );
}
