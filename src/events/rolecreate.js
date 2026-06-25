"use strict";

const { AuditLogEvent, PermissionFlagsBits } = require("discord.js");
const AntiNukeMemory = require("../core/antinukeMemory");
const resolveAudit   = require("../core/resolveAuditAdvanced");

const wlkey = "role_create";

module.exports = (client) => {
    client.on("roleCreate", async (role) => {
        const g = AntiNukeMemory.get(role.guild.id);
        if (!g?.enabled || g.modules?.antirole === false) return;

        try {
            const result = await resolveAudit(role.guild, AuditLogEvent.RoleCreate, role.id);
            if (!result) return;

            const { executorId } = result;
            if (!executorId) return;
            if (executorId === client.user.id) return;
            if (executorId === role.guild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(role.guild, g, executorId, wlkey)) return;

            const hasDanger = [
                PermissionFlagsBits.Administrator,
                PermissionFlagsBits.ManageRoles,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.BanMembers,
                PermissionFlagsBits.KickMembers,
            ].some((p) => role.permissions.has(p));

            if (!hasDanger) return;

            client.sntl.trackViolation(role.guild, g, "role");
            await role.delete("Luna: Unauthorized dangerous role creation").catch(() => {});
            await client.sntl.AntinukePunish(role.guild, g, executorId, `Created dangerous role "${role.name}"`);
            await client.logSendHandler.send(role.guild, g, {
                executorId,
                actionType:    "role_create",
                reason:        `Created dangerous role "${role.name}"`,
                targetDetails: role.id,
            });
        } catch (err) {
            client.logger.error(`[antiRoleCreate] ${err.message}`);
        }
    });
};
