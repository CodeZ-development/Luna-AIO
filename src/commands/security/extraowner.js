const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const Antinuke          = require("../../models/antinuke.js");
const AntiNukeMemory    = require("../../core/antinukeMemory");
const { updateGuildAntiNuke } = require("../../core/loadAntiNuke");

function txt(c) { return new TextDisplayBuilder().setContent(c); }

module.exports = {
    name: "extraowner",
    aliases: ["eo", "coowner"],
    category: "security",
    cooldown: 3,

    run: async (client, message, args) => {
        if (message.author.id !== message.guild.ownerId) {
            return client.util.container(message, `# Access Denied\n-# Only the server owner can manage extra owners.`);
        }

        const sub    = args[0]?.toLowerCase();
        const prefix = message.guild.prefix || "?";

        switch (sub) {
            case "add": {
                const userId = message.mentions.users.first()?.id || args[1]?.replace(/[<@!>]/g, "");
                if (!userId) return client.util.container(message, `Usage: \`${prefix}extraowner add @user\``);

                const member = await message.guild.members.fetch(userId).catch(() => null);
                if (!member) return client.util.container(message, `# User Not Found\n-# That user is not in this server.`);
                if (userId === message.guild.ownerId) return client.util.container(message, `# Invalid\n-# You cannot add yourself as an extra owner.`);
                if (member.user.bot) return client.util.container(message, `# Invalid\n-# Bots cannot be extra owners.`);

                const anti = await Antinuke.findById(message.guild.id).lean();
                if (anti?.extraowner?.includes(userId)) {
                    return client.util.container(message, `# Already an Extra Owner\n-# **${member.user.tag}** is already an extra owner.`);
                }

                await Antinuke.updateOne({ _id: message.guild.id }, { $addToSet: { extraowner: userId } }, { upsert: true });
                await updateGuildAntiNuke(message.guild.id);

                return client.util.container(message, `# Extra Owner Added\n-# **${member.user.tag}** can now manage antinuke settings.`);
            }

            case "remove": {
                const userId = message.mentions.users.first()?.id || args[1]?.replace(/[<@!>]/g, "");
                if (!userId) return client.util.container(message, `Usage: \`${prefix}extraowner remove @user\``);

                const g = AntiNukeMemory.get(message.guild.id);
                if (!g?.extraOwners?.has(userId)) return client.util.container(message, `# Not an Extra Owner\n-# That user is not an extra owner.`);

                await Antinuke.updateOne({ _id: message.guild.id }, { $pull: { extraowner: userId } }, { upsert: true });
                await updateGuildAntiNuke(message.guild.id);

                const user = await client.users.fetch(userId).catch(() => null);
                return client.util.container(message, `# Extra Owner Removed\n-# **${user?.tag ?? userId}** removed from extra owners.`);
            }

            case "reset": {
                await Antinuke.updateOne({ _id: message.guild.id }, { $set: { extraowner: [] } }, { upsert: true });
                await updateGuildAntiNuke(message.guild.id);
                return client.util.container(message, `# Extra Owners Reset\n-# All extra owners have been removed.`);
            }

            case "list":
            case "panel": {
                const g = AntiNukeMemory.get(message.guild.id);
                const owners = [...(g?.extraOwners ?? [])];

                if (!owners.length) return client.util.container(message, `# Extra Owners\n-# No extra owners have been configured.`);

                const lines = await Promise.all(owners.map(async (id, i) => {
                    const user = await client.users.fetch(id).catch(() => null);
                    return `${i + 1}. **${user?.tag ?? "Unknown"}** | \`${id}\``;
                }));

                const container = new ContainerBuilder()
                    .addTextDisplayComponents(txt(`## Extra Owners — ${owners.length} total`))
                    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                    .addTextDisplayComponents(txt(lines.join("\n")))
                    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                    .addTextDisplayComponents(txt(`-# Extra owners can manage antinuke settings but cannot change owner-only settings.`));

                return message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
            }

            default: {
                return client.util.container(message,
                    `## Extra Owner Commands\n\n` +
                    `\`${prefix}extraowner add @user\` — Add a co-owner\n` +
                    `\`${prefix}extraowner remove @user\` — Remove a co-owner\n` +
                    `\`${prefix}extraowner list\` — View all extra owners\n` +
                    `\`${prefix}extraowner reset\` — Remove all extra owners\n\n` +
                    `-# Extra owners can configure antinuke but cannot touch owner-only features.`,
                );
            }
        }
    },
};
