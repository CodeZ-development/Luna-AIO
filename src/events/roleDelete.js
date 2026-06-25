"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");
const Antinuke          = require("../models/antinuke");

module.exports = (client) => {
    client.on("roleDelete", async (role) => {
        const g = AntiNukeMemory.get(role.guild.id);
        if (!g?.enabled) return;

        try {
            const result = await resolveAudit(role.guild, AuditLogEvent.RoleDelete, role.id, { ttl: 6_000, auditLimit: 3 });
            if (!result?.executorId) return;

            const { executorId } = result;
            if (executorId === client.user.id) return;

            const isSystemRole   = role.id === g.quarantineRoleId || role.id === g.unbypassRoleId;
            const isOwnerOrExtra = executorId === role.guild.ownerId || g.extraOwners?.has(executorId);

            if (isSystemRole) {
                const recovered = role.id === g.quarantineRoleId
                    ? await client.sntl.quarantinedelete(role.guild, g)
                    : await client.sntl.unbypassroledelete(role.guild, g);

                await Promise.all([
                    !isOwnerOrExtra && client.sntl.AntinukePunish(role.guild, g, executorId, `Deleted Luna system role "${role.name}"`),
                    client.logSendHandler.send(role.guild, g, {
                        executorId,
                        actionType:    "role",
                        reason:        `Deleted system role "${role.name}" — ${recovered ? "Restored" : "Could not restore"}`,
                        targetDetails: role.id,
                    }),
                ].filter(Boolean));
                return;
            }

            if (isOwnerOrExtra) return;

            const isProtected = g.protectedRoles?.has(role.id);
            if (!isProtected && g.modules?.antirole === false) return;

            client.sntl.trackViolation(role.guild, g, "role");
            if (await client.sntl.isTrusted(role.guild, g, executorId, "role_delete")) return;

            const recovered = await role.guild.roles.create({
                name:         role.name,
                color:        role.color,
                hoist:        role.hoist,
                permissions:  role.permissions,
                mentionable:  role.mentionable,
                position:     role.rawPosition,
                icon:         role.icon ?? undefined,
                unicodeEmoji: role.unicodeEmoji ?? undefined,
                reason:       "Luna: anti-role-delete recovery",
            }).catch(() => null);

            if (recovered && isProtected) {
                g.protectedRoles.delete(role.id);
                g.protectedRoles.add(recovered.id);
                AntiNukeMemory.set(role.guild.id, g);
                Antinuke.updateOne(
                    { _id: role.guild.id },
                    { $pull: { protectedRoles: role.id }, $addToSet: { protectedRoles: recovered.id } },
                ).catch(() => {});
            }

            await Promise.all([
                client.sntl.AntinukePunish(role.guild, g, executorId, `Deleted role "${role.name}"`),
                client.logSendHandler.send(role.guild, g, {
                    executorId,
                    actionType:    "role",
                    reason:        `Deleted "${role.name}" — ${recovered ? "Restored" : "Could not restore"}`,
                    targetDetails: role.id,
                }),
            ]);
        } catch (err) {
            client.logger.error(`[antiRoleDelete] ${err.message}`);
        }
    });
};
