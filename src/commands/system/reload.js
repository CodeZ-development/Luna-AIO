"use strict";

const path = require("path");
const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const emoji = require("../../core/emoji");

module.exports = {
    name: "reload",
    aliases: ["r"],
    description: "Reload a command without restarting the bot.",
    category: "system",
    ownerOnly: true,
    async execute(client, message, args) {
        const name = args[0]?.toLowerCase();
        if (!name) return message.reply(`Usage: \`${client.prefix}reload <command>\``);

        const cmd = client.commands.get(name) || client.commands.get(client.aliases.get(name));
        if (!cmd) {
            const c = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${emoji.error} Command \`${name}\` not found.`),
            );
            return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }

        const found = _findFile(client, cmd.name);
        if (!found) {
            const c = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${emoji.error} Could not locate file for \`${cmd.name}\`.`),
            );
            return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }

        try {
            delete require.cache[require.resolve(found)];
            const fresh = require(found);

            client.commands.delete(cmd.name);
            if (cmd.aliases) cmd.aliases.forEach((a) => client.aliases.delete(a));

            client.commands.set(fresh.name, fresh);
            if (fresh.aliases) fresh.aliases.forEach((a) => client.aliases.set(a, fresh.name));

            const c = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${emoji.success} Reloaded \`${fresh.name}\``,
                ),
            );
            return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        } catch (err) {
            const c = new ContainerBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${emoji.error} Reload failed:\n\`\`\`${err.message}\`\`\``,
                ),
            );
            return message.reply({ components: [c], flags: MessageFlags.IsComponentsV2 });
        }
    },
};

function _findFile(client, cmdName) {
    const cats = ["security", "moderation", "utility", "automod", "system"];
    for (const cat of cats) {
        try {
            const p = path.join(__dirname, `../${cat}/${cmdName}.js`);
            require.resolve(p);
            return p;
        } catch {}
    }
    return null;
}
