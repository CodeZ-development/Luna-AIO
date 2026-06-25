const crypto = require("crypto");

module.exports = {
    name: "warn",
    aliases: ["w"],
    category: "moderation",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("ModerateMembers")) {
            return client.util.container(message, `# Access Denied\n-# You need **Moderate Members** permission.`);
        }

        const sub = args[0]?.toLowerCase();
        const prefix = message.guild.prefix || "?";

        if (sub === "list") {
            const target = message.mentions.users.first() || await client.users.fetch(args[1]).catch(() => null);
            if (!target) return client.util.container(message, `Usage: \`${prefix}warn list @user\``);

            const warns = client.warn.prepare(`SELECT * FROM warnings WHERE guildId = ? AND userId = ? ORDER BY id DESC LIMIT 20`).all(message.guild.id, target.id);
            if (!warns.length) return client.util.container(message, `# Warnings — ${target.tag}\n-# No warnings on record.`);

            const lines = warns.map((w, i) => `${i + 1}. \`${w.warnId}\` — ${w.reason} | by <@${w.moderatorId}> | <t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:R>`).join("\n");
            return client.util.container(message, `## Warnings — ${target.tag} (${warns.length})\n\n${lines}`);
        }

        if (sub === "remove" || sub === "delete") {
            const warnId = args[1];
            if (!warnId) return client.util.container(message, `Usage: \`${prefix}warn remove <warnId>\``);

            const deleted = client.warn.prepare(`DELETE FROM warnings WHERE warnId = ? AND guildId = ?`).run(warnId, message.guild.id);
            if (deleted.changes === 0) return client.util.container(message, `# Not Found\n-# No warning with ID \`${warnId}\` found.`);
            return client.util.container(message, `# Warning Removed\n-# Warning \`${warnId}\` has been deleted.`);
        }

        const target = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!target) return client.util.container(message,
            `## Warn Command\n\n` +
            `\`${prefix}warn @user [reason]\` — Warn a user\n` +
            `\`${prefix}warn list @user\` — View warnings\n` +
            `\`${prefix}warn remove <warnId>\` — Remove a warning`,
        );

        const reason = args.slice(1).join(" ") || "No reason provided";
        const warnId = crypto.randomBytes(3).toString("hex");
        const ts     = new Date().toISOString();

        client.warn.prepare(`INSERT INTO warnings (guildId, userId, reason, moderatorId, timestamp, warnId) VALUES (?, ?, ?, ?, ?, ?)`).run(
            message.guild.id, target.id, reason, message.author.id, ts, warnId,
        );

        const count = client.warn.prepare(`SELECT COUNT(*) as c FROM warnings WHERE guildId = ? AND userId = ?`).get(message.guild.id, target.id).c;

        return client.util.container(message,
            `# Warning Issued\n` +
            `-# ID: \`${warnId}\`\n` +
            `-# User: **${target.tag}** (${count} total warnings)\n` +
            `-# Reason: ${reason}`,
        );
    },
};
