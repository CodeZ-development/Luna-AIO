module.exports = {
    name: "blacklist",
    aliases: ["bl"],
    category: "system",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!client.config.owner.includes(message.author.id)) {
            return client.util.container(message, `# Access Denied\n-# This command is restricted to bot owners.`);
        }

        const sub    = args[0]?.toLowerCase();
        const prefix = message.guild?.prefix || "?";

        if (sub === "server") {
            const serverSub = args[1]?.toLowerCase();
            const guildId   = args[2] || message.guild?.id;

            if (serverSub === "add") {
                let bl = await client.db.get("blacklist_server") || {};
                bl[guildId] = { addedBy: message.author.id, addedAt: Date.now() };
                await client.db.set("blacklist_server", bl);
                await client.util.blacklistserver();
                return client.util.container(message, `# Server Blacklisted\n-# Server \`${guildId}\` has been blacklisted.`);
            }

            if (serverSub === "remove") {
                let bl = await client.db.get("blacklist_server") || {};
                delete bl[guildId];
                await client.db.set("blacklist_server", bl);
                await client.util.blacklistserver();
                return client.util.container(message, `# Server Unblacklisted\n-# Server \`${guildId}\` removed from blacklist.`);
            }

            if (serverSub === "list") {
                const bl  = await client.db.get("blacklist_server") || {};
                const ids = Object.keys(bl);
                if (!ids.length) return client.util.container(message, `# Blacklisted Servers\n-# None.`);
                return client.util.container(message, `## Blacklisted Servers\n\n${ids.map((id) => `- \`${id}\``).join("\n")}`);
            }

            return client.util.container(message, `Usage: \`${prefix}blacklist server add|remove|list [guildId]\``);
        }

        const userId = message.mentions.users.first()?.id || args[1]?.replace(/[<@!>]/g, "");

        if (sub === "add") {
            if (!userId) return client.util.container(message, `Usage: \`${prefix}blacklist add @user [reason]\``);
            const reason = args.slice(2).join(" ") || "No reason provided";
            let bl = await client.db.get("blacklist_user") || {};
            bl[userId] = { addedBy: message.author.id, addedAt: Date.now(), reason };
            await client.db.set("blacklist_user", bl);
            await client.util.blacklist();
            return client.util.container(message, `# Blacklisted\n-# User \`${userId}\` has been blacklisted.\n-# Reason: ${reason}`);
        }

        if (sub === "remove") {
            if (!userId) return client.util.container(message, `Usage: \`${prefix}blacklist remove @user\``);
            let bl = await client.db.get("blacklist_user") || {};
            delete bl[userId];
            await client.db.set("blacklist_user", bl);
            await client.util.blacklist();
            return client.util.container(message, `# Unblacklisted\n-# User \`${userId}\` removed from blacklist.`);
        }

        if (sub === "list") {
            const bl  = await client.db.get("blacklist_user") || {};
            const ids = Object.keys(bl);
            if (!ids.length) return client.util.container(message, `# Blacklisted Users\n-# None.`);
            const lines = ids.map((id) => `- \`${id}\` — ${bl[id].reason ?? "No reason"}`);
            return client.util.container(message, `## Blacklisted Users (${ids.length})\n\n${lines.join("\n")}`);
        }

        return client.util.container(message,
            `## Blacklist Commands\n\n` +
            `\`${prefix}blacklist add @user [reason]\`\n` +
            `\`${prefix}blacklist remove @user\`\n` +
            `\`${prefix}blacklist list\`\n` +
            `\`${prefix}blacklist server add|remove|list [guildId]\``,
        );
    },
};
