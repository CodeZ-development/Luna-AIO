"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");

module.exports = (client) => {
    client.on("webhookUpdate", async (channel) => {
        if (!channel.guild) return;

        const g = AntiNukeMemory.get(channel.guild.id);
        if (!g?.enabled || g.modules?.antiwebhook === false) return;

        try {
            const result = await resolveAudit(channel.guild, AuditLogEvent.WebhookUpdate, channel.id, { ttl: 12_000 });
            if (!result) return;

            const { executorId } = result;
            if (!executorId) return;
            if (executorId === client.user.id) return;
            if (await client.sntl.isTrusted(channel.guild, g, executorId, "webhook_update")) return;

            await client.logSendHandler.send(channel.guild, g, {
                executorId,
                actionType:    "webhook_update",
                reason:        `Updated a webhook in #${channel.name}`,
                targetDetails: channel.id,
            });
        } catch (err) {
            client.logger.error(`[antiWebhookUpdate] ${err.message}`);
        }
    });
};
