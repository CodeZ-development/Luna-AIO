"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");

module.exports = (client) => {
    client.on("stickerCreate", async (sticker) => {
        const g = AntiNukeMemory.get(sticker.guildId);
        if (!g?.enabled || g.modules?.antisticker === false) return;

        try {
            const guild = client.guilds.cache.get(sticker.guildId);
            if (!guild) return;

            const result = await resolveAudit(guild, AuditLogEvent.StickerCreate, sticker.id);
            if (!result) return;

            const { executorId } = result;
            if (!executorId || executorId === client.user.id) return;
            if (executorId === guild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(guild, g, executorId, "sticker_create")) return;

            await sticker.delete("Luna: Unauthorized sticker creation").catch(() => {});
            await client.logSendHandler.send(guild, g, {
                executorId,
                actionType:    "sticker_create",
                reason:        `Created sticker "${sticker.name}" — deleted`,
                targetDetails: sticker.id,
            });
        } catch (err) {
            client.logger.error(`[antiStickerCreate] ${err.message}`);
        }
    });
};
