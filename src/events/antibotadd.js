"use strict";

const { AuditLogEvent, UserFlagsBitField } = require("discord.js");
const AntiNukeMemory = require("../core/antinukeMemory");
const resolveAudit   = require("../core/resolveAuditAdvanced");

const wlkey = "bot_add";

module.exports = (client) => {
    client.on("guildMemberAdd", async (member) => {
        if (!member.user.bot) return;

        const g = AntiNukeMemory.get(member.guild.id);
        if (!g?.enabled || g.modules?.antibotadd === false) return;

        try {
            const result = await resolveAudit(member.guild, AuditLogEvent.BotAdd, member.id);
            if (!result) return;

            const { executorId, victim } = result;
            if (!executorId) return;
            if (executorId === member.guild.ownerId) return;

            const botMember  = await member.guild.members.fetch(member.id).catch(() => null);
            if (!botMember) return;

            const isVerified = botMember.user.flags?.has(UserFlagsBitField.Flags.VerifiedBot);

            if (!isVerified) {
                await botMember.ban({ reason: "Luna: Unverified bot added" }).catch(() => {});
                await client.sntl.AntinukePunish(member.guild, g, executorId, `Added unverified bot ${victim?.tag ?? member.user.tag}`);
                return;
            }

            client.sntl.trackViolation(member.guild, g, "botadd");
            if (await client.sntl.isTrusted(member.guild, g, executorId, wlkey)) return;

            await botMember.ban({ reason: "Luna: Unauthorized bot addition" }).catch(() => {});
            await client.sntl.AntinukePunish(member.guild, g, executorId, `Added bot ${victim?.tag ?? member.user.tag}`);
            await client.logSendHandler.send(member.guild, g, {
                executorId,
                actionType:    "bot_add",
                reason:        `Unauthorized bot added: ${victim?.tag ?? member.user.tag}`,
                targetDetails: member.id,
            });
        } catch (err) {
            client.logger.error(`[antibotadd] ${err.message}`);
        }
    });
};
