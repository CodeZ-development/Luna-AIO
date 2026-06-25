"use strict";

const { AuditLogEvent, PermissionFlagsBits } = require("discord.js");
const AntiNukeMemory = require("../core/antinukeMemory");
const resolveAudit   = require("../core/resolveAuditAdvanced");

const DANGEROUS = [
    PermissionFlagsBits.Administrator,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.BanMembers,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.ManageGuild,
];

module.exports = (client) => {
    client.on("roleUpdate", async (oldRole, newRole) => {
        const g = AntiNukeMemory.get(newRole.guild.id);
        if (!g?.enabled || g.modules?.antilink === false) return;

        try {
            if (!newRole.tags?.guildConnections) return;

            const hasDanger = DANGEROUS.some((p) => newRole.permissions.has(p));
            if (!hasDanger) return;

            const result = await resolveAudit(newRole.guild, AuditLogEvent.RoleUpdate, newRole.id, { ttl: 12_000 });
            if (!result) return;

            const { executorId } = result;
            if (!executorId || executorId === client.user.id) return;
            if (executorId === newRole.guild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(newRole.guild, g, executorId, "linkrole")) return;

            await newRole.setPermissions(0n, "Luna: Stripped dangerous permissions from linked role").catch(() => {});
            client.sntl.trackViolation(newRole.guild, g, "linkroleadd");

            await client.logSendHandler.send(newRole.guild, g, {
                executorId,
                actionType:    "linkrole_update",
                reason:        `Linked role "${newRole.name}" had dangerous permissions — stripped`,
                targetDetails: newRole.id,
            });
        } catch (err) {
            client.logger.error(`[antiLinkRole] ${err.message}`);
        }
    });
};
