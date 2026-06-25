"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");

module.exports = (client) => {
    client.on("webhookCreate", async (webhook) => {
        if (!webhook.guildId) return;

        const guild = client.guilds.cache.get(webhook.guildId);
        if (!guild) return;

        const g = AntiNukeMemory.get(guild.id);
        if (!g?.enabled || g.modules?.antiwebhook === false) return;

        try {
            const result = await resolveAudit(guild, AuditLogEvent.WebhookCreate, webhook.id, { ttl: 8_000, retryDelayMs: 600 });
            if (!result?.executorId) return;

            const { executorId } = result;
            if (executorId === client.user.id) return;
            if (await client.sntl.isTrusted(guild, g, executorId, "webhook_create")) return;

            client.sntl.trackViolation(guild, g, "webhook");

            await Promise.all([
                webhook.delete("Luna: unauthorized webhook").catch(() => {}),
                client.sntl.AntinukePunish(guild, g, executorId, `Created webhook "${webhook.name}" in <#${webhook.channelId}>`),
                client.logSendHandler.send(guild, g, {
                    executorId,
                    actionType:    "webhook",
                    reason:        `Created webhook "${webhook.name}" — deleted`,
                    targetDetails: webhook.id,
                }),
            ]);
        } catch (err) {
            client.logger.error(`[antiWebhookCreate] ${err.message}`);
        }
    });
};
