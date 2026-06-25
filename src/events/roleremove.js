"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");

module.exports = (client) => {
    client.on("guildMemberUpdate", async (oldMember, newMember) => {
        const g = AntiNukeMemory.get(newMember.guild.id);
        if (!g?.enabled) return;

        try {
            const removedSystemRoles = oldMember.roles.cache.filter(
                (r) => !newMember.roles.cache.has(r.id) && (r.id === g.unbypassRoleId || r.id === g.quarantineRoleId),
            );

            if (!removedSystemRoles.size) return;

            const result = await resolveAudit(newMember.guild, AuditLogEvent.MemberRoleUpdate, newMember.id, { ttl: 10_000 });
            if (!result) return;

            const { executorId } = result;
            if (!executorId || executorId === client.user.id) return;
            if (executorId === newMember.guild.ownerId || g.extraOwners?.has(executorId)) return;

            for (const [roleId] of removedSystemRoles) {
                await newMember.roles.add(roleId, "Luna: Restoring removed system role").catch(() => {});
            }

            client.sntl.trackViolation(newMember.guild, g, "unbypass_remove");
        } catch (err) {
            client.logger.error(`[antiRoleRemove] ${err.message}`);
        }
    });
};
