"use strict";

const { AuditLogEvent, PermissionFlagsBits } = require("discord.js");
const AntiNukeMemory = require("../core/antinukeMemory");
const resolveAudit   = require("../core/resolveAuditAdvanced");

const wlkey = "role_add";

module.exports = (client) => {
    client.on("guildMemberUpdate", async (oldMember, newMember) => {
        const g = AntiNukeMemory.get(newMember.guild.id);
        if (!g?.enabled || g.modules?.antirole === false) return;

        try {
            const addedRoleIds = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id)).map((r) => r.id);
            if (!addedRoleIds.length) return;

            const addedDangerous = addedRoleIds.filter((id) => {
                const role = newMember.guild.roles.cache.get(id);
                return role && [PermissionFlagsBits.Administrator, PermissionFlagsBits.ManageGuild, PermissionFlagsBits.BanMembers, PermissionFlagsBits.ManageRoles].some((p) => role.permissions.has(p));
            });

            if (!addedDangerous.length) return;

            const result = await resolveAudit(newMember.guild, AuditLogEvent.MemberRoleUpdate, newMember.id, { ttl: 10_000 });
            if (!result) return;

            const { executorId } = result;
            if (!executorId) return;
            if (executorId === client.user.id) return;
            if (executorId === newMember.guild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(newMember.guild, g, executorId, wlkey)) return;

            for (const roleId of addedDangerous) {
                await newMember.roles.remove(roleId, "Luna: Unauthorized dangerous role assignment").catch(() => {});
            }

            await client.logSendHandler.send(newMember.guild, g, {
                executorId,
                actionType:    "role_add",
                reason:        `Assigned dangerous role(s) to ${newMember.user.tag}`,
                targetDetails: newMember.id,
            });
        } catch (err) {
            client.logger.error(`[antiRoleAdd] ${err.message}`);
        }
    });
};
