"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");

module.exports = (client) => {
    client.on("stickerDelete", async (sticker) => {
        const g = AntiNukeMemory.get(sticker.guildId);
        if (!g?.enabled || g.modules?.antisticker === false) return;

        try {
            const guild = client.guilds.cache.get(sticker.guildId);
            if (!guild) return;

            const result = await resolveAudit(guild, AuditLogEvent.StickerDelete, sticker.id);
            if (!result) return;

            const { executorId } = result;
            if (!executorId || executorId === client.user.id) return;
            if (executorId === guild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(guild, g, executorId, "sticker_delete")) return;

            client.sntl.trackViolation(guild, g, "channel");
            await client.sntl.AntinukePunish(guild, g, executorId, `Deleted sticker "${sticker.name}"`);
            await client.logSendHandler.send(guild, g, {
                executorId,
                actionType:    "sticker_delete",
                reason:        `Deleted sticker "${sticker.name}"`,
                targetDetails: sticker.id,
            });
        } catch (err) {
            client.logger.error(`[antiStickerDelete] ${err.message}`);
        }
    });
};
