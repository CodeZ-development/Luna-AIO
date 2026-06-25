"use strict";

const { AuditLogEvent } = require("discord.js");
const AntiNukeMemory    = require("../core/antinukeMemory");
const resolveAudit      = require("../core/resolveAuditAdvanced");

module.exports = (client) => {
    client.on("channelDelete", async (channel) => {
        if (!channel.guild) return;

        const g = AntiNukeMemory.get(channel.guild.id);
        if (!g?.enabled || g.modules?.antichannel === false) return;

        try {
            const result = await resolveAudit(channel.guild, AuditLogEvent.ChannelDelete, channel.id, { ttl: 6_000, auditLimit: 3 });
            if (!result?.executorId) return;

            const { executorId } = result;
            if (executorId === client.user.id) return;
            if (executorId === channel.guild.ownerId || g.extraOwners?.has(executorId)) return;

            client.sntl.trackViolation(channel.guild, g, "channel");
            if (await client.sntl.isTrusted(channel.guild, g, executorId, "channel_delete")) return;

            const [recreated] = await Promise.all([
                channel.guild.channels.create({
                    name:  channel.name,
                    type:  channel.type,
                    topic: channel.topic ?? undefined,
                    nsfw:  channel.nsfw ?? false,
                    bitrate:   channel.bitrate ?? undefined,
                    userLimit: channel.userLimit ?? undefined,
                    parent:    channel.parentId ?? undefined,
                    permissionOverwrites: channel.permissionOverwrites?.cache.map((o) => ({
                        id: o.id, allow: o.allow, deny: o.deny, type: o.type,
                    })) ?? [],
                    position: channel.rawPosition ?? undefined,
                    reason: "Luna: anti-channel-delete recovery",
                }).catch(() => null),
            ]);

            await Promise.all([
                client.sntl.AntinukePunish(channel.guild, g, executorId, `Deleted #${channel.name}`),
                client.logSendHandler.send(channel.guild, g, {
                    executorId,
                    actionType:    "channel",
                    reason:        `Deleted #${channel.name} — ${recreated ? "Restored" : "Could not restore"}`,
                    targetDetails: channel.id,
                }),
            ]);
        } catch (err) {
            client.logger.error(`[antiChannelDelete] ${err.message}`);
        }
    });
};
