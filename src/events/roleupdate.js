"use strict";

const { AuditLogEvent, PermissionFlagsBits } = require("discord.js");
const AntiNukeMemory = require("../core/antinukeMemory");
const resolveAudit   = require("../core/resolveAuditAdvanced");

const wlkey = "role_update";

const DANGEROUS = [
    PermissionFlagsBits.Administrator,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageWebhooks,
];

module.exports = (client) => {
    client.on("roleUpdate", async (oldRole, newRole) => {
        const g = AntiNukeMemory.get(newRole.guild.id);
        if (!g?.enabled || g.modules?.antirole === false) return;

        try {
            const gained = newRole.permissions.missing(oldRole.permissions);
            const hasDanger = DANGEROUS.some((p) => gained.includes(p));
            if (!hasDanger) return;

            const result = await resolveAudit(newRole.guild, AuditLogEvent.RoleUpdate, newRole.id, { ttl: 12_000 });
            if (!result) return;

            const { executorId } = result;
            if (!executorId) return;
            if (executorId === client.user.id) return;
            if (executorId === newRole.guild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(newRole.guild, g, executorId, wlkey)) return;

            await newRole.setPermissions(oldRole.permissions, "Luna: Reverting unauthorized role permission update").catch(() => {});
            client.sntl.trackViolation(newRole.guild, g, "role");
            await client.sntl.AntinukePunish(newRole.guild, g, executorId, `Gave dangerous permissions to role "${newRole.name}"`);
            await client.logSendHandler.send(newRole.guild, g, {
                executorId,
                actionType:    "role_update",
                reason:        `Added dangerous permissions to "${newRole.name}" — reverted`,
                targetDetails: newRole.id,
            });
        } catch (err) {
            client.logger.error(`[antiRoleUpdate] ${err.message}`);
        }
    });
};
