"use strict";

const {
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    SeparatorBuilder,
} = require("discord.js");

const AntiNukeMemory    = require("../../core/antinukeMemory");
const Antinuke          = require("../../models/antinuke.js");
const { updateGuildAntiNuke } = require("../../core/loadAntiNuke");

function txt(c)  { return new TextDisplayBuilder().setContent(c); }
function sep()   { return new SeparatorBuilder().setDivider(true); }

function formatAge(ts) {
    if (!ts || isNaN(ts)) return "unknown";
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

async function quarantineRelease(client, guild, userId, releasedBy) {
    const anti = await Antinuke.findById(guild.id).lean();
    const entry = anti?.quarantineData?.[userId];
    if (!entry) return { success: false, reason: "No quarantine record found" };

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return { success: false, reason: "Member not found" };

    const oldRoles = entry.oldRoles?.filter((id) => guild.roles.cache.has(id)) ?? [];
    try {
        await member.roles.set(oldRoles, "Luna: Quarantine released");
    } catch (err) {
        return { success: false, reason: `Could not restore roles: ${err.message}` };
    }

    await Antinuke.updateOne(
        { _id: guild.id },
        {
            $unset: { [`quarantineData.${userId}`]: "", [`punishedusers.${userId}`]: "" },
        },
    );
    await updateGuildAntiNuke(guild.id);

    const g = AntiNukeMemory.get(guild.id);
    if (g) {
        g.punishedUsers.delete(userId);
        AntiNukeMemory.set(guild.id, g);
    }

    return { success: true };
}

function isAuthorized(message, data) {
    return message.author.id === message.guild.ownerId || (data?.extraOwners?.has(message.author.id) ?? false);
}

module.exports = {
    name: "quarantine",
    aliases: ["quar", "q"],
    category: "security",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!message.guild) return;

        const data = AntiNukeMemory.get(message.guild.id);
        if (!data?.enabled) {
            return client.util.container(message, `# Quarantine — Offline\n-# Antinuke is not enabled on this server.`);
        }

        if (!isAuthorized(message, data)) {
            return client.util.container(message, `# Access Denied\n-# Only the server owner or extra owners can manage quarantine.`);
        }

        const sub = (args[0] ?? "").toLowerCase();

        switch (sub) {
            case "list":
            case "panel": {
                return handleList(client, message);
            }

            case "release":
            case "free": {
                const userId = message.mentions.users.first()?.id || args[1]?.replace(/[<@!>]/g, "");
                if (!userId) return client.util.container(message, `Usage: \`${message.guild.prefix || "?"}quarantine release @user\``);
                const res = await quarantineRelease(client, message.guild, userId, message.author.id);
                const user = await client.users.fetch(userId).catch(() => null);
                return client.util.container(message, res.success
                    ? `# Quarantine — Released\n-# **${user?.tag ?? userId}** has been released from quarantine and their roles restored.`
                    : `# Quarantine — Failed\n-# ${res.reason}`);
            }

            case "view":
            case "inspect": {
                const userId = message.mentions.users.first()?.id || args[1]?.replace(/[<@!>]/g, "");
                if (!userId) return client.util.container(message, `Usage: \`${message.guild.prefix || "?"}quarantine view @user\``);

                const anti  = await Antinuke.findById(message.guild.id).lean();
                const entry = anti?.quarantineData?.[userId];

                if (!entry) return client.util.container(message, `# Not Quarantined\n-# No quarantine record found for that user.`);

                const user = await client.users.fetch(userId).catch(() => null);
                const text =
                    `## Quarantine — Subject File\n\n` +
                    `**User:** ${user?.tag ?? "Unknown"} | \`${userId}\`\n` +
                    `**Reason:** ${entry.reason ?? "No reason"}\n` +
                    `**Held For:** ${formatAge(new Date(entry.timestamp).getTime())}\n` +
                    `**Original Roles:** ${entry.oldRoles?.length ?? 0} roles\n` +
                    `**Dangerous Roles Removed:** ${entry.removedDangerousRoles?.length ?? 0}`;

                return client.util.container(message, text);
            }

            case "resetall":
            case "clearall": {
                const entries = [...(data.punishedUsers?.entries() ?? [])];
                if (!entries.length) return client.util.container(message, `# No Quarantined Users\n-# The quarantine registry is empty.`);

                let released = 0, failed = 0;
                for (const [userId] of entries) {
                    const res = await quarantineRelease(client, message.guild, userId, message.author.id);
                    if (res.success) released++;
                    else failed++;
                }

                return client.util.container(message, `# Mass Release Complete\n-# Released: **${released}** | Failed: **${failed}** | Total: **${entries.length}**`);
            }

            default: {
                return client.util.container(message,
                    `## Quarantine Commands\n\n` +
                    `\`${message.guild.prefix || "?"}quarantine list\` — View quarantined users\n` +
                    `\`${message.guild.prefix || "?"}quarantine release @user\` — Release a user\n` +
                    `\`${message.guild.prefix || "?"}quarantine view @user\` — Inspect a quarantined user\n` +
                    `\`${message.guild.prefix || "?"}quarantine resetall\` — Release all quarantined users\n\n` +
                    `-# Quarantine removes all dangerous roles and isolates the user.`,
                );
            }
        }
    },
};

async function handleList(client, message) {
    const g       = AntiNukeMemory.get(message.guild.id);
    const entries = [...(g?.punishedUsers?.entries() ?? [])];

    if (!entries.length) {
        return client.util.container(message, `# Quarantine Registry\n-# No users are currently quarantined.`);
    }

    const lines = await Promise.all(entries.map(async ([id, entry], i) => {
        const member = await message.guild.members.fetch(id).catch(() => null);
        const tag    = member ? member.user.tag : id;
        const age    = entry.punishedAt ? formatAge(new Date(entry.punishedAt).getTime()) : "unknown";
        return `${i + 1}. **${tag}** | \`${id}\`\n   Reason: ${entry.reason}\n   Held: ${age}`;
    }));

    const container = new ContainerBuilder()
        .addTextDisplayComponents(txt(`## Quarantine Registry — ${entries.length} held`))
        .addSeparatorComponents(sep())
        .addTextDisplayComponents(txt(lines.join("\n\n")));

    return message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
}
