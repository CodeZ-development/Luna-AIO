const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
} = require("discord.js");

const Antinuke          = require("../../models/antinuke.js");
const AntiNukeMemory    = require("../../core/antinukeMemory");
const { updateGuildAntiNuke } = require("../../core/loadAntiNuke");

module.exports = {
    name: "roleprotect",
    aliases: ["rp", "protectrole"],
    category: "security",
    cooldown: 3,

    run: async (client, message, args) => {
        const own   = message.author.id === message.guild.ownerId;
        const check = await client.util.isExtraOwner(message.author, message.guild);
        if (!own && !check) return client.util.container(message, `# Access Denied\n-# Only the server owner or an extra owner can manage role protection.`);

        const sub    = args[0]?.toLowerCase();
        const prefix = message.guild.prefix || "?";

        switch (sub) {
            case "add": {
                const roleId = message.mentions.roles.first()?.id || args[1]?.replace(/[<@&>]/g, "");
                if (!roleId) return client.util.container(message, `Usage: \`${prefix}roleprotect add @role\``);

                const role = message.guild.roles.cache.get(roleId);
                if (!role) return client.util.container(message, `# Role Not Found\n-# That role does not exist.`);

                await Antinuke.updateOne({ _id: message.guild.id }, { $addToSet: { protectedRoles: roleId } }, { upsert: true });
                await updateGuildAntiNuke(message.guild.id);

                return client.util.container(message, `# Role Protected\n-# **${role.name}** is now a protected role.\n-# If deleted or modified, Luna will attempt to restore it.`);
            }

            case "remove": {
                const roleId = message.mentions.roles.first()?.id || args[1]?.replace(/[<@&>]/g, "");
                if (!roleId) return client.util.container(message, `Usage: \`${prefix}roleprotect remove @role\``);

                await Antinuke.updateOne({ _id: message.guild.id }, { $pull: { protectedRoles: roleId } }, { upsert: true });
                await updateGuildAntiNuke(message.guild.id);

                return client.util.container(message, `# Role Unprotected\n-# Role \`${roleId}\` removed from protection.`);
            }

            case "list": {
                const g       = AntiNukeMemory.get(message.guild.id);
                const roleIds = [...(g?.protectedRoles ?? [])];

                if (!roleIds.length) return client.util.container(message, `# Protected Roles\n-# No roles are currently protected.`);

                const lines = roleIds.map((id, i) => {
                    const role = message.guild.roles.cache.get(id);
                    return `${i + 1}. ${role ? `${role} (${role.name})` : "Deleted Role"} | \`${id}\``;
                });

                const container = new ContainerBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Protected Roles — ${roleIds.length} total`))
                    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n")));

                return message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
            }

            default: {
                return client.util.container(message,
                    `## Role Protection\n\n` +
                    `\`${prefix}roleprotect add @role\` — Protect a role\n` +
                    `\`${prefix}roleprotect remove @role\` — Remove role from protection\n` +
                    `\`${prefix}roleprotect list\` — View protected roles\n\n` +
                    `-# Protected roles are watched and restored if deleted or modified by unauthorized users.`,
                );
            }
        }
    },
};
