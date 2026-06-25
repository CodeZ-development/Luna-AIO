"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");

const SENSITIVE = ["name", "icon", "splash", "discoverySplash", "banner", "verificationLevel", "explicitContentFilter", "mfaLevel", "vanityURLCode"];
const wlkey = "guild_update";

module.exports = (client) => {
    client.on("guildUpdate", async (oldGuild, newGuild) => {
        const g = AntiNukeMemory.get(newGuild.id);
        if (!g?.enabled || g.modules?.antiserver === false) return;

        try {
            const changed = SENSITIVE.filter((f) => oldGuild[f] !== newGuild[f]);
            if (!changed.length) return;

            const result = await resolveAudit(newGuild, AuditLogEvent.GuildUpdate, newGuild.id, { ttl: 15_000, retryDelayMs: 1500 });
            if (!result) return;

            const { executorId } = result;
            if (!executorId) return;
            if (executorId === client.user.id) return;
            if (executorId === newGuild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(newGuild, g, executorId, wlkey)) return;

            const revert = {};
            for (const f of changed) revert[f] = oldGuild[f] ?? null;
            await newGuild.edit(revert, "Luna: Reverting unauthorized guild update").catch(() => {});

            await client.sntl.AntinukePunish(newGuild, g, executorId, `Updated guild settings: ${changed.join(", ")}`);
            await client.logSendHandler.send(newGuild, g, {
                executorId,
                actionType:    "guild_update",
                reason:        `Guild settings changed: ${changed.join(", ")} — reverted`,
                targetDetails: newGuild.id,
            });
        } catch (err) {
            client.logger.error(`[antiGuildUpdate] ${err.message}`);
        }
    });
};
