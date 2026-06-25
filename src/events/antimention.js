"use strict";

const AntiNukeMemory = require("../core/antinukeMemory");

const mentionCooldowns = new Map();

async function handleAntinukeMention(client, message) {
    if (!message.guild || message.author.bot) return;

    const g = AntiNukeMemory.get(message.guild.id);
    if (!g?.enabled || g.modules?.antimention === false) return;

    const mentionsEveryone  = message.mentions.everyone;
    const mentionedRoles    = message.mentions.roles;
    const largeMentions     = mentionedRoles.filter((r) => r.members.size >= 5);

    if (!mentionsEveryone && !largeMentions.size) return;

    const userId = message.author.id;
    if (await client.sntl.isTrusted(message.guild, g, userId, "mention")) return;

    const now = Date.now();
    const key = `${message.guild.id}_${userId}`;

    if (!mentionCooldowns.has(key)) mentionCooldowns.set(key, []);
    const bucket = mentionCooldowns.get(key).filter((t) => now - t < 10_000);
    bucket.push(now);
    mentionCooldowns.set(key, bucket);

    const threshold = client.sntl.getThreshold(g, "mention");
    if (bucket.length < threshold) return;

    await message.delete().catch(() => {});

    client.sntl.trackViolation(message.guild, g, "mention");
    await client.sntl.AntinukePunish(message.guild, g, userId, `Mass mention detected (${bucket.length} mentions in 10s)`);
    await client.logSendHandler.send(message.guild, g, {
        executorId:    userId,
        actionType:    "mention",
        reason:        `Mass mention: ${bucket.length} in 10 seconds`,
        targetDetails: message.channel.id,
    });
}

module.exports = (client) => {};
module.exports.handleAntinukeMention = handleAntinukeMention;
