"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");

module.exports = (client) => {
    client.on("integrationDelete", async (integration) => {
        const g = AntiNukeMemory.get(integration.guildId);
        if (!g?.enabled || g.modules?.antiintegration === false) return;

        try {
            const guild = client.guilds.cache.get(integration.guildId);
            if (!guild) return;

            const result = await resolveAudit(guild, AuditLogEvent.IntegrationDelete, integration.id, { ttl: 12_000 });
            if (!result) return;

            const { executorId } = result;
            if (!executorId || executorId === client.user.id) return;
            if (executorId === guild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(guild, g, executorId, "integration_delete")) return;

            await client.logSendHandler.send(guild, g, {
                executorId,
                actionType:    "integration_delete",
                reason:        `Removed integration "${integration.name}"`,
                targetDetails: integration.id,
            });
        } catch (err) {
            client.logger.error(`[antiIntegrationDelete] ${err.message}`);
        }
    });
};
