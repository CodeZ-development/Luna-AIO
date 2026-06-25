"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");

const FAST = { ttl: 5_000, auditLimit: 3, allowRetry: false };

module.exports = (client) => {
    client.on("guildMemberRemove", async (member) => {
        const g = AntiNukeMemory.get(member.guild.id);
        if (!g?.enabled || g.modules?.antikick === false) return;

        try {
            const result = await resolveAudit(member.guild, AuditLogEvent.MemberKick, member.id, FAST);
            if (!result?.executorId) return;

            const { executorId } = result;
            if (executorId === client.user.id) return;
            if (executorId === member.guild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(member.guild, g, executorId, "member_kick")) return;

            client.sntl.trackViolation(member.guild, g, "kick");

            await Promise.all([
                client.sntl.AntinukePunish(member.guild, g, executorId, `Kicked ${member.user.tag} (${member.id})`),
                client.logSendHandler.send(member.guild, g, {
                    executorId,
                    actionType:    "kick",
                    reason:        `Kicked ${member.user.tag}`,
                    targetDetails: member.id,
                }),
            ]);
        } catch (err) {
            client.logger.error(`[antikick] ${err.message}`);
        }
    });
};
