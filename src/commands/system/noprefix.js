const NP_KEY = "noprefix_users";
const now = () => Math.floor(Date.now() / 1000);

module.exports = {
    name: "noprefix",
    aliases: ["np"],
    category: "system",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!client.config.owner.includes(message.author.id)) {
            return client.util.container(message, `# Access Denied\n-# This command is restricted to bot owners.`);
        }

        const sub    = args[0]?.toLowerCase();
        const prefix = message.guild?.prefix || "?";

        const parseExpiry = (str) => {
            if (!str) return null;
            const units = { m: 60, h: 3600, d: 86400, w: 604800 };
            const match = str.match(/^(\d+)([mhdw])$/i);
            if (!match) return null;
            return now() + parseInt(match[1]) * units[match[2].toLowerCase()];
        };

        const userId = message.mentions.users.first()?.id || args[1]?.replace(/[<@!>]/g, "");

        if (sub === "add") {
            if (!userId) return client.util.container(message, `Usage: \`${prefix}noprefix add @user [expiry]\``);
            const expiresAt = parseExpiry(args[2]);
            let data = await client.db.get(NP_KEY) || {};
            data[userId] = { addedBy: message.author.id, addedAt: now(), expiresAt };
            await client.db.set(NP_KEY, data);
            await client.util.noprefix();
            const expiryTxt = expiresAt ? `<t:${expiresAt}:R>` : "Never";
            return client.util.container(message, `# No-Prefix Added\n-# User \`${userId}\` can now use commands without a prefix.\n-# Expires: ${expiryTxt}`);
        }

        if (sub === "remove") {
            if (!userId) return client.util.container(message, `Usage: \`${prefix}noprefix remove @user\``);
            let data = await client.db.get(NP_KEY) || {};
            delete data[userId];
            await client.db.set(NP_KEY, data);
            await client.util.noprefix();
            return client.util.container(message, `# No-Prefix Removed\n-# User \`${userId}\` no longer has no-prefix access.`);
        }

        if (sub === "list") {
            const data = await client.db.get(NP_KEY) || {};
            const ids  = Object.keys(data);
            if (!ids.length) return client.util.container(message, `# No-Prefix List\n-# No users have no-prefix access.`);
            const lines = ids.map((id) => {
                const entry    = data[id];
                const expiry   = entry.expiresAt ? `<t:${entry.expiresAt}:R>` : "Never";
                return `- \`${id}\` — expires: ${expiry}`;
            });
            return client.util.container(message, `## No-Prefix Users (${ids.length})\n\n${lines.join("\n")}`);
        }

        return client.util.container(message,
            `## No-Prefix Commands\n\n` +
            `\`${prefix}noprefix add @user [1d/1h/1m]\` — Grant no-prefix\n` +
            `\`${prefix}noprefix remove @user\` — Revoke no-prefix\n` +
            `\`${prefix}noprefix list\` — View all no-prefix users`,
        );
    },
};
