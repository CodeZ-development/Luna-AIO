"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");

module.exports = (client) => {
    client.on("threadDelete", async (thread) => {
        if (!thread.guild) return;

        const g = AntiNukeMemory.get(thread.guild.id);
        if (!g?.enabled || g.modules?.antithread === false) return;

        try {
            const result = await resolveAudit(thread.guild, AuditLogEvent.ThreadDelete, thread.id);
            if (!result) return;

            const { executorId } = result;
            if (!executorId || executorId === client.user.id) return;
            if (executorId === thread.guild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(thread.guild, g, executorId, "thread_delete")) return;

            client.sntl.trackViolation(thread.guild, g, "channel");
            await client.sntl.AntinukePunish(thread.guild, g, executorId, `Deleted thread "${thread.name}"`);
            await client.logSendHandler.send(thread.guild, g, {
                executorId,
                actionType:    "thread_delete",
                reason:        `Deleted thread "${thread.name}"`,
                targetDetails: thread.id,
            });
        } catch (err) {
            client.logger.error(`[antiThreadDelete] ${err.message}`);
        }
    });
};
