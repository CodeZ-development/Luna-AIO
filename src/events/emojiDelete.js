"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");

module.exports = (client) => {
    client.on("emojiDelete", async (emoji) => {
        const g = AntiNukeMemory.get(emoji.guild.id);
        if (!g?.enabled || g.modules?.antiemoji === false) return;

        try {
            const result = await resolveAudit(emoji.guild, AuditLogEvent.EmojiDelete, emoji.id);
            if (!result) return;

            const { executorId } = result;
            if (!executorId || executorId === client.user.id) return;
            if (executorId === emoji.guild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(emoji.guild, g, executorId, "emoji_delete")) return;

            client.sntl.trackViolation(emoji.guild, g, "channel");
            await client.sntl.AntinukePunish(emoji.guild, g, executorId, `Deleted emoji :${emoji.name}:`);
            await client.logSendHandler.send(emoji.guild, g, {
                executorId,
                actionType:    "emoji_delete",
                reason:        `Deleted emoji :${emoji.name}:`,
                targetDetails: emoji.id,
            });
        } catch (err) {
            client.logger.error(`[antiEmojiDelete] ${err.message}`);
        }
    });
};
