"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");

const FAST = { ttl: 5_000, auditLimit: 3, allowRetry: false };

module.exports = (client) => {
    client.on("guildBanAdd", async (ban) => {
        const g = AntiNukeMemory.get(ban.guild.id);
        if (!g?.enabled || g.modules?.antiban === false) return;

        try {
            const result = await resolveAudit(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id, FAST);
            if (!result?.executorId) return;

            const { executorId } = result;
            if (executorId === client.user.id) return;
            if (executorId === ban.guild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(ban.guild, g, executorId, "member_ban")) return;

            client.sntl.trackViolation(ban.guild, g, "ban");

            await Promise.all([
                client.sntl.AntinukePunish(ban.guild, g, executorId, `Banned ${ban.user.tag} (${ban.user.id})`),
                client.logSendHandler.send(ban.guild, g, {
                    executorId,
                    actionType:    "ban",
                    reason:        `Banned ${ban.user.tag}`,
                    targetDetails: ban.user.id,
                }),
            ]);
        } catch (err) {
            client.logger.error(`[antiban] ${err.message}`);
        }
    });
};
