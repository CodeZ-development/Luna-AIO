"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");

module.exports = (client) => {
    client.on("integrationCreate", async (integration) => {
        const g = AntiNukeMemory.get(integration.guildId);
        if (!g?.enabled || g.modules?.antiintegration === false) return;

        try {
            const guild = client.guilds.cache.get(integration.guildId);
            if (!guild) return;

            const result = await resolveAudit(guild, AuditLogEvent.IntegrationCreate, integration.id, { ttl: 15_000 });
            if (!result) return;

            const { executorId } = result;
            if (!executorId || executorId === client.user.id) return;
            if (executorId === guild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(guild, g, executorId, "integration_create")) return;

            await guild.deleteIntegration(integration.id).catch(() => {});
            await client.sntl.AntinukePunish(guild, g, executorId, `Added integration "${integration.name}"`);
            await client.logSendHandler.send(guild, g, {
                executorId,
                actionType:    "integration_create",
                reason:        `Added integration "${integration.name}" — removed`,
                targetDetails: integration.id,
            });
        } catch (err) {
            client.logger.error(`[antiIntegrationCreate] ${err.message}`);
        }
    });
};
