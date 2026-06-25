const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    UserSelectMenuBuilder,
} = require("discord.js");

const Antinuke          = require("../../models/antinuke.js");
const AntiNukeMemory    = require("../../core/antinukeMemory");
const { updateGuildAntiNuke } = require("../../core/loadAntiNuke");

const ALL_ACTIONS = [
    "member_ban", "member_kick", "member_unban", "bot_add",
    "channel_create", "channel_delete", "channel_update",
    "role_create", "role_delete", "role_update", "role_add",
    "webhook_create", "webhook_update", "guild_update",
    "emoji_create", "emoji_delete", "sticker_create", "sticker_delete",
    "integration_create", "integration_delete", "thread_delete", "mention",
];

function txt(content) {
    return new TextDisplayBuilder().setContent(content);
}

module.exports = {
    name: "whitelist",
    aliases: ["wl"],
    category: "security",
    cooldown: 3,

    run: async (client, message, args) => {
        const own   = message.author.id === message.guild.ownerId;
        const check = await client.util.isExtraOwner(message.author, message.guild);
        if (!own && !check) return client.util.container(message, `# Access Denied\n-# Only the server owner or an extra owner can manage the whitelist.`);

        const sub    = args[0]?.toLowerCase();
        const prefix = message.guild.prefix || "?";

        switch (sub) {
            case "add": {
                const userId = message.mentions.users.first()?.id || args[1]?.replace(/[<@!>]/g, "");
                if (!userId) return client.util.container(message, `Usage: \`${prefix}whitelist add @user [action1 action2 ...]\``);

                const member = await message.guild.members.fetch(userId).catch(() => null);
                if (!member) return client.util.container(message, `# User Not Found\n-# That user is not in this server.`);

                const perms = args.slice(2).filter((a) => ALL_ACTIONS.includes(a));
                const grantedPerms = perms.length ? perms : ALL_ACTIONS;

                await Antinuke.updateOne(
                    { _id: message.guild.id },
                    { $set: { [`whitelist.${userId}`]: grantedPerms } },
                    { upsert: true },
                );
                await updateGuildAntiNuke(message.guild.id);

                return client.util.container(message, `# Whitelist — Added\n-# **${member.user.tag}** has been whitelisted${perms.length ? ` for: ${perms.join(", ")}` : " for all actions"}.`);
            }

            case "remove": {
                const userId = message.mentions.users.first()?.id || args[1]?.replace(/[<@!>]/g, "");
                if (!userId) return client.util.container(message, `Usage: \`${prefix}whitelist remove @user\``);

                const g = AntiNukeMemory.get(message.guild.id);
                if (!g?.whitelist?.has(userId)) return client.util.container(message, `# Not Whitelisted\n-# That user is not on the whitelist.`);

                await Antinuke.updateOne({ _id: message.guild.id }, { $unset: { [`whitelist.${userId}`]: "" } }, { upsert: true });
                await updateGuildAntiNuke(message.guild.id);

                return client.util.container(message, `# Whitelist — Removed\n-# User \`${userId}\` removed from whitelist.`);
            }

            case "reset": {
                await Antinuke.updateOne({ _id: message.guild.id }, { $set: { whitelist: {} } }, { upsert: true });
                await updateGuildAntiNuke(message.guild.id);
                return client.util.container(message, `# Whitelist — Reset\n-# All whitelisted users have been removed.`);
            }

            case "list":
            case "view":
            case "panel": {
                const g = AntiNukeMemory.get(message.guild.id);
                const entries = [...(g?.whitelist?.entries() ?? [])];

                if (!entries.length) return client.util.container(message, `# Whitelist\n-# No users are currently whitelisted.`);

                const lines = await Promise.all(entries.map(async ([id, perms], i) => {
                    const user = await client.users.fetch(id).catch(() => null);
                    const tag  = user ? user.tag : id;
                    const permList = Array.isArray(perms) ? perms.join(", ") : "all";
                    return `${i + 1}. **${tag}** | \`${id}\`\n   Actions: ${permList}`;
                }));

                const container = new ContainerBuilder()
                    .addTextDisplayComponents(txt(`## Whitelist — ${entries.length} ${entries.length === 1 ? "entry" : "entries"}`))
                    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                    .addTextDisplayComponents(txt(lines.join("\n\n")));

                return message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
            }

            default: {
                return client.util.container(message,
                    `## Whitelist Commands\n\n` +
                    `\`${prefix}whitelist add @user [actions]\` — Add a user to the whitelist\n` +
                    `\`${prefix}whitelist remove @user\` — Remove a user from the whitelist\n` +
                    `\`${prefix}whitelist list\` — View all whitelisted users\n` +
                    `\`${prefix}whitelist reset\` — Clear the entire whitelist\n\n` +
                    `-# Whitelisted users bypass antinuke checks for their allowed actions.`,
                );
            }
        }
    },
};
