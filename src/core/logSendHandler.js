"use strict";

const {
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    MessageFlags,
    SeparatorBuilder,
    ThumbnailBuilder,
    SeparatorSpacingSize,
} = require("discord.js");
const emoji = require("./emoji");

const ACTION_LABEL = {
    ban:       `${emoji.ban} ban`,
    kick:      `${emoji.kick} kick`,
    mute:      `${emoji.mute} mute`,
    unban:     `${emoji.unban} unban`,
    channel:   `${emoji.channel} channel`,
    role:      `${emoji.role} role`,
    webhook:   `${emoji.webhook} webhook`,
    botadd:    `${emoji.bot} bot add`,
    mention:   `${emoji.warning} mass mention`,
    guildupdate: `${emoji.settings} server update`,
    default:   `${emoji.shield} security`,
};

class logSendHandler {
    constructor(client) {
        this.client = client;
    }

    async send(guild, g, data) {
        try {
            const { executorId, actionType, reason, targetDetails } = data;
            if (!g.logChannel) return;

            const [executor, logChannel] = await Promise.all([
                guild.members.fetch(executorId).catch(() => null),
                guild.channels.fetch(g.logChannel).catch(() => null),
            ]);

            if (!logChannel?.isTextBased()) return;

            const timestamp = `<t:${Math.floor(Date.now() / 1000)}:F>`;
            const avatarURL = executor?.user?.displayAvatarURL?.() ||
                `https://api.dicebear.com/7.x/identicon/png?seed=${executorId}`;
            const label = ACTION_LABEL[actionType] ?? ACTION_LABEL.default;

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${emoji.shield} Luna Security Response\n-# Automated protection in **${guild.name}**`,
                    ),
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
                )
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `${emoji.member} **Executor**\n<@${executorId}> \`${executorId}\``,
                            ),
                        )
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(avatarURL)),
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false),
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emoji.logs} **Action** — ${label}\n${emoji.dot} ${reason}\n${emoji.dot} Target: \`${targetDetails}\``,
                    ),
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`-# ${timestamp} ${emoji.dot} razebot.site`),
                );

            const payload = { components: [container], flags: MessageFlags.IsComponentsV2 };

            const tasks = [logChannel.send(payload).catch(() => {})];

            if (g.notifyowners) {
                const ids = new Set([guild.ownerId, ...(g.extraOwners ?? [])]);
                for (const id of ids) {
                    const m = await guild.members.fetch(id).catch(() => null);
                    if (m) tasks.push(m.send(payload).catch(() => {}));
                }
            }

            await Promise.all(tasks);
        } catch {}
    }
}

module.exports = logSendHandler;
