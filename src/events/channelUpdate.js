"use strict";

const { AuditLogEvent, PermissionFlagsBits } = require("discord.js");
const AntiNukeMemory = require("../core/antinukeMemory");
const resolveAudit   = require("../core/resolveAuditAdvanced");

const wlkey = "channel_update";

module.exports = (client) => {
    client.on("channelUpdate", async (oldChannel, newChannel) => {
        if (!newChannel.guild) return;

        const g = AntiNukeMemory.get(newChannel.guild.id);
        if (!g?.enabled || g.modules?.antichannel === false) return;

        try {
            const result = await resolveAudit(newChannel.guild, AuditLogEvent.ChannelUpdate, newChannel.id, { ttl: 12_000 });
            if (!result) return;

            const { executorId } = result;
            if (!executorId) return;
            if (executorId === client.user.id) return;
            if (executorId === newChannel.guild.ownerId || g.extraOwners?.has(executorId)) return;
            if (await client.sntl.isTrusted(newChannel.guild, g, executorId, wlkey)) return;

            await client.logSendHandler.send(newChannel.guild, g, {
                executorId,
                actionType:    "channel_update",
                reason:        `Updated channel #${newChannel.name}`,
                targetDetails: newChannel.id,
            });
        } catch (err) {
            client.logger.error(`[antiChannelUpdate] ${err.message}`);
        }
    });
};
