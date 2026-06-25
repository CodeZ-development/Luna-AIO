"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");

const wlkey = "member_unban";

module.exports = (client) => {
    client.on("guildBanRemove", async (ban) => {
        const g = AntiNukeMemory.get(ban.guild.id);
        if (!g?.enabled || g.modules?.antiunban === false) return;

        try {
            const result = await resolveAudit(ban.guild, AuditLogEvent.MemberBanRemove, ban.user.id);
            if (!result) return;

            const { executorId } = result;
            if (!executorId) return;
            if (executorId === client.user.id) return;
            if (executorId === ban.guild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(ban.guild, g, executorId, wlkey)) return;

            client.sntl.trackViolation(ban.guild, g, "unban");
            await client.sntl.AntinukePunish(ban.guild, g, executorId, `Unbanned ${ban.user.tag} (${ban.user.id})`);
            await client.logSendHandler.send(ban.guild, g, {
                executorId,
                actionType:    "unban",
                reason:        `Unbanned ${ban.user.tag} (${ban.user.id})`,
                targetDetails: ban.user.id,
            });
        } catch (err) {
            client.logger.error(`[antiunban] ${err.message}`);
        }
    });
};
