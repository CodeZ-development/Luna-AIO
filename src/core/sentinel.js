"use strict";

const AntiNukeMemory = require("./antinukeMemory");
const {
    PermissionFlagsBits,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
    SeparatorSpacingSize,
} = require("discord.js");
const antinuke = require("../models/antinuke.js");

const DEFAULT_THRESHOLDS = {
    ban:              3,
    kick:             3,
    channel:          4,
    role:             4,
    botadd:           2,
    mention:          3,
    unban:            3,
    webhook:          3,
    linkroleadd:      3,
    unbypass_remove:  2,
    quarantine_remove: 2,
};

const WINDOW_MS = 10_000;

const DANGEROUS_PERMS = [
    PermissionFlagsBits.Administrator,
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageWebhooks,
];

class Sentinel {
    constructor(client) {
        this.client = client;
    }

    getThreshold(g, type) {
        const custom = g.thresholds?.[type];
        return typeof custom === "number" ? custom : (DEFAULT_THRESHOLDS[type] ?? 5);
    }

    isAllowed(g, userId, action) {
        const perms = g.whitelist.get(userId);
        if (!perms) return false;
        return perms.includes ? perms.includes(action) : perms.has(action);
    }

    async isTrusted(guild, g, userId, action) {
        if (userId === this.client.user.id) return true;
        if (userId === guild.ownerId) return true;
        if (g.extraOwners?.has(userId)) return true;
        if (!g.panic && this.isAllowed(g, userId, action)) return true;

        if (g.panic && g.panicWhitelistRoles?.size > 0) {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member?.roles.cache.some((r) => g.panicWhitelistRoles.has(r.id))) return true;
        }

        return false;
    }

    async AntinukePunish(guild, g, userId, reason) {
        if (!guild || !g || !userId) return;
        if (userId === this.client.user.id) return;
        if (userId === guild.ownerId || g.extraOwners?.has(userId)) return;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return;

        const botMember = guild.members.me;
        if (member.roles.highest.position >= botMember.roles.highest.position) return;

        if (member.user.bot) {
            await Promise.all([
                this.stripRoles(member, reason),
                this.executeBan(guild, member, reason),
            ]);
            return;
        }

        const action = g.punishment || "ban";

        switch (action) {
            case "ban":
                await this.executeBan(guild, member, reason);
                break;
            case "kick":
                await this.executeKick(guild, member, reason);
                break;
            case "quarantine":
                await this.executeQuarantine(guild, g, member, reason);
                break;
            default:
                await this.executeBan(guild, member, reason);
        }

        if (action === "quarantine") {
            const entry = { action, reason, punishedAt: new Date() };
            g.punishedUsers.set(userId, entry);
            AntiNukeMemory.set(guild.id, g);
            antinuke.updateOne(
                { _id: guild.id },
                { $set: { [`punishedusers.${userId}`]: entry } },
            ).catch(() => {});
        }
    }

    async executeBan(guild, member, reason) {
        try {
            await guild.members.ban(member.id, { reason: `[Luna] ${reason}` });
        } catch {
            await this.stripRoles(member, reason);
        }
    }

    async executeKick(guild, member, reason) {
        try {
            await guild.members.kick(member.id, `[Luna] ${reason}`);
        } catch {
            await this.stripRoles(member, reason);
        }
    }

    async executeQuarantine(guild, g, member, reason) {
        const quarantineReady = await this.handlequarantine(guild);
        if (!quarantineReady) {
            await this.executeBan(guild, member, reason);
            return;
        }

        try {
            const quarantineRole = await guild.roles.fetch(g.quarantineRoleId);
            const currentRoles   = member.roles.cache.filter((r) => r.id !== guild.id).map((r) => r.id);
            const dangerousRoles = currentRoles.filter((id) => {
                const role = guild.roles.cache.get(id);
                return role && DANGEROUS_PERMS.some((p) => role.permissions.has(p));
            });

            antinuke.updateOne(
                { _id: guild.id },
                { $set: { [`quarantineData.${member.id}`]: { oldRoles: currentRoles, removedDangerousRoles: dangerousRoles, reason, timestamp: new Date() } } },
            ).catch(() => {});

            await member.roles.set([quarantineRole.id]);
        } catch {
            await this.stripRoles(member, reason);
        }
    }

    async stripRoles(member, reason) {
        const removable = member.roles.cache.filter((r) => r.editable && r.id !== member.guild.id);
        await Promise.all([...removable.values()].map((r) => member.roles.remove(r, `[Luna] ${reason}`).catch(() => {})));
    }

    async handlequarantine(guild) {
        const data = AntiNukeMemory.get(guild.id);
        if (!data) return false;

        let qRole = data.quarantineRoleId
            ? await guild.roles.fetch(data.quarantineRoleId).catch(() => null)
            : null;

        if (!qRole) {
            try {
                qRole = await guild.roles.create({
                    name: "Luna Quarantine",
                    permissions: [],
                    reason: "Luna: quarantine role",
                });
                data.quarantineRoleId = qRole.id;
                AntiNukeMemory.set(guild.id, data);
                await Promise.all(
                    [...guild.channels.cache.values()].map((ch) => this.enforceQuarantine(guild, ch, qRole.id).catch(() => {}))
                );
                antinuke.findByIdAndUpdate(guild.id, { quarantineroleid: qRole.id }).catch(() => {});
            } catch {
                return false;
            }
        }

        if (qRole.permissions.bitfield !== 0n) {
            await qRole.setPermissions([], "Luna: quarantine perms reset").catch(() => {});
        }

        return true;
    }

    async enforceQuarantine(guild, channel, roleId) {
        if (!channel.manageable) return;
        await channel.permissionOverwrites.edit(roleId, {
            ViewChannel: true,
            SendMessages: false,
            AddReactions: false,
            Speak: false,
            Connect: false,
            Stream: false,
            CreatePublicThreads: false,
            CreatePrivateThreads: false,
            SendMessagesInThreads: false,
            EmbedLinks: false,
            AttachFiles: false,
        }).catch(() => {});
    }

    trackViolation(guild, g, type) {
        if (!g.buckets) g.buckets = new Map();
        if (!g.buckets.has(type)) g.buckets.set(type, []);

        const now    = Date.now();
        const bucket = g.buckets.get(type).filter((t) => now - t < WINDOW_MS);
        bucket.push(now);
        g.buckets.set(type, bucket);

        if (bucket.length >= this.getThreshold(g, type) && !g.panic) {
            this.activatePanicMode(guild, g);
        }
    }

    async activatePanicMode(guild, g) {
        g.panic = true;
        if (!g.panicWhitelistRoles) g.panicWhitelistRoles = new Set();
        AntiNukeMemory.set(guild.id, g);

        const roles   = await guild.roles.fetch();
        const botRole = guild.members.me.roles.highest;
        const backup  = {};

        const updates = [];
        for (const [roleId, role] of roles) {
            if (roleId === botRole.id) continue;
            if (g.panicWhitelistRoles.has(roleId)) continue;
            if (DANGEROUS_PERMS.some((p) => role.permissions.has(p))) {
                backup[roleId] = role.permissions.bitfield.toString();
                const safe = role.permissions.remove(DANGEROUS_PERMS);
                updates.push(role.setPermissions(safe, "Luna: Panic Mode").catch(() => {}));
            }
        }
        await Promise.all(updates);

        g.panicBackup = new Map(Object.entries(backup));
        AntiNukeMemory.set(guild.id, g);
        antinuke.updateOne({ _id: guild.id }, { $set: { panic: true, panicBackup: backup } }).catch(() => {});

        const msg = `## [Luna] Panic Mode Activated\n-# Threshold exceeded — dangerous permissions stripped.\n\n**Server**: ${guild.name}\n-# Use \`antinuke panic disable\` to restore.`;

        if (g.logChannel) {
            const ch = await guild.channels.fetch(g.logChannel).catch(() => null);
            if (ch?.isTextBased()) {
                const c = new ContainerBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(msg));
                ch.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            }
        }

        const owner = await guild.fetchOwner().catch(() => null);
        if (owner && g.notifyowners !== false) {
            const c = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `## [Luna] Panic Mode — ${guild.name}\nSecurity threshold exceeded. Dangerous permissions stripped automatically.\n\nUse \`antinuke panic disable\` when safe.`,
                ));
            owner.send({ components: [c], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }
    }

    async restorePanicMode(guild, g) {
        if (!g.panicBackup?.size) return false;

        const botRole = guild.members.me.roles.highest;
        const updates = [];

        for (const [roleId, permBitfield] of g.panicBackup) {
            const role = await guild.roles.fetch(roleId).catch(() => null);
            if (!role || role.position >= botRole.position) continue;
            updates.push(role.setPermissions(BigInt(permBitfield), "Luna: Panic restore").catch(() => {}));
        }
        await Promise.all(updates);

        g.panicBackup.clear();
        AntiNukeMemory.set(guild.id, g);
        antinuke.updateOne({ _id: guild.id }, { $unset: { panicBackup: "" } }).catch(() => {});

        return true;
    }

    async unbypassroledelete(guild, g) {
        try {
            const botMember  = guild.members.cache.get(this.client.user.id);
            const position   = botMember?.roles.highest.position ?? 0;

            const createdRole = await guild.roles.create({
                name: "Luna unbypass",
                position,
                reason: "Luna: Restoring unbypass role",
                permissions: [PermissionFlagsBits.Administrator],
            });

            g.unbypassRoleId = createdRole.id;
            AntiNukeMemory.set(guild.id, g);
            antinuke.findByIdAndUpdate(guild.id, { unbypassRoleId: createdRole.id }).catch(() => {});

            const freshBot = await guild.members.fetch(this.client.user.id).catch(() => null);
            if (freshBot) await freshBot.roles.add(createdRole.id).catch(() => {});

            return createdRole;
        } catch {
            return null;
        }
    }

    async quarantinedelete(guild, g) {
        const quarantineReady = await this.handlequarantine(guild);
        if (!quarantineReady) return null;

        const fresh = AntiNukeMemory.get(guild.id);
        if (fresh) g = fresh;

        const quarantineRole = await guild.roles.fetch(g.quarantineRoleId).catch(() => null);
        if (!quarantineRole) return null;

        for (const [userId] of g.punishedUsers) {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) continue;
            const roles = member.roles.cache;
            if (!(roles.size === 2 && roles.has(quarantineRole.id))) {
                await this.executeQuarantine(guild, g, member, "Re-quarantine: previously punished");
            }
        }

        return quarantineRole;
    }
}

module.exports = Sentinel;
