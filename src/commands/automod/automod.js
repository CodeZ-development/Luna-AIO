"use strict";

const Automod = require("../../models/automod.js");

const automodCache = new Map();

async function loadAutomodCache() {
    const docs = await Automod.find({ enabled: true }).lean();
    for (const doc of docs) {
        automodCache.set(doc._id, doc);
    }
    console.log(`[Luna] Loaded ${docs.length} automod configs`);
}

const spamTracker = new Map();

async function checker(message) {
    if (!message.guild || message.author?.bot) return;

    const config = automodCache.get(message.guild.id);
    if (!config?.enabled) return;

    const userId  = message.author.id;
    const content = message.content;

    if (config.immuneRoles?.some((rId) => message.member?.roles.cache.has(rId))) return;

    const inviteRegex = /discord\.gg\/[a-zA-Z0-9]+/i;
    const linkRegex   = /https?:\/\/[^\s]+/gi;

    if (config.antiinvite && inviteRegex.test(content)) {
        await message.delete().catch(() => {});
        return;
    }

    if (config.antilink && linkRegex.test(content)) {
        const isWhitelisted = config.whitelist?.some((url) => content.includes(url));
        if (!isWhitelisted) {
            await message.delete().catch(() => {});
            return;
        }
    }

    if (config.badwords?.length) {
        const lower = content.toLowerCase();
        for (const word of config.badwords) {
            if (lower.includes(word.toLowerCase())) {
                await message.delete().catch(() => {});
                return;
            }
        }
    }

    if (config.antispam) {
        const now = Date.now();
        const key = `${message.guild.id}_${userId}`;
        if (!spamTracker.has(key)) spamTracker.set(key, []);
        const bucket = spamTracker.get(key).filter((t) => now - t < 5000);
        bucket.push(now);
        spamTracker.set(key, bucket);

        const limit = config.spamLimit ?? 5;
        if (bucket.length >= limit) {
            await message.delete().catch(() => {});
            if (config.action === "mute" || config.action === "timeout") {
                await message.member?.timeout(30_000, "Automod: Spam detected").catch(() => {});
            }
            spamTracker.set(key, []);
        }
    }
}

module.exports = {
    name: "automod",
    aliases: ["am"],
    category: "automod",
    cooldown: 3,

    loadAutomodCache,
    checker,

    run: async (client, message, args) => {
        if (!message.member.permissions.has("ManageGuild")) {
            return client.util.container(message, `# Access Denied\n-# You need **Manage Server** permission.`);
        }

        const sub    = args[0]?.toLowerCase();
        const prefix = message.guild.prefix || "?";

        switch (sub) {
            case "enable": {
                await Automod.updateOne({ _id: message.guild.id }, { $set: { enabled: true } }, { upsert: true });
                const doc = await Automod.findById(message.guild.id).lean();
                automodCache.set(message.guild.id, doc);
                return client.util.container(message, `# Automod Enabled\n-# Automated moderation is now active.`);
            }

            case "disable": {
                await Automod.updateOne({ _id: message.guild.id }, { $set: { enabled: false } }, { upsert: true });
                automodCache.delete(message.guild.id);
                return client.util.container(message, `# Automod Disabled\n-# Automated moderation has been turned off.`);
            }

            case "antilink": {
                const toggle = args[1]?.toLowerCase();
                if (!["on", "off"].includes(toggle)) return client.util.container(message, `Usage: \`${prefix}automod antilink on|off\``);
                const val = toggle === "on";
                await Automod.updateOne({ _id: message.guild.id }, { $set: { antilink: val } }, { upsert: true });
                const doc = await Automod.findById(message.guild.id).lean();
                automodCache.set(message.guild.id, doc);
                return client.util.container(message, `# Anti-Link ${val ? "Enabled" : "Disabled"}\n-# Link filtering is now **${val ? "on" : "off"}**.`);
            }

            case "antiinvite": {
                const toggle = args[1]?.toLowerCase();
                if (!["on", "off"].includes(toggle)) return client.util.container(message, `Usage: \`${prefix}automod antiinvite on|off\``);
                const val = toggle === "on";
                await Automod.updateOne({ _id: message.guild.id }, { $set: { antiinvite: val } }, { upsert: true });
                const doc = await Automod.findById(message.guild.id).lean();
                automodCache.set(message.guild.id, doc);
                return client.util.container(message, `# Anti-Invite ${val ? "Enabled" : "Disabled"}\n-# Discord invite filtering is now **${val ? "on" : "off"}**.`);
            }

            case "antispam": {
                const toggle = args[1]?.toLowerCase();
                if (!["on", "off"].includes(toggle)) return client.util.container(message, `Usage: \`${prefix}automod antispam on|off [limit]\``);
                const val   = toggle === "on";
                const limit = parseInt(args[2]) || 5;
                await Automod.updateOne({ _id: message.guild.id }, { $set: { antispam: val, spamLimit: limit } }, { upsert: true });
                const doc = await Automod.findById(message.guild.id).lean();
                automodCache.set(message.guild.id, doc);
                return client.util.container(message, `# Anti-Spam ${val ? "Enabled" : "Disabled"}\n-# Spam limit: ${limit} messages per 5 seconds.`);
            }

            case "badword":
            case "badwords": {
                const action = args[1]?.toLowerCase();
                const words  = args.slice(2).map((w) => w.toLowerCase());

                if (action === "add") {
                    if (!words.length) return client.util.container(message, `Usage: \`${prefix}automod badwords add word1 word2\``);
                    await Automod.updateOne({ _id: message.guild.id }, { $addToSet: { badwords: { $each: words } } }, { upsert: true });
                    const doc = await Automod.findById(message.guild.id).lean();
                    automodCache.set(message.guild.id, doc);
                    return client.util.container(message, `# Badwords Added\n-# Added: ${words.map((w) => `\`${w}\``).join(", ")}`);
                }

                if (action === "remove") {
                    if (!words.length) return client.util.container(message, `Usage: \`${prefix}automod badwords remove word1\``);
                    await Automod.updateOne({ _id: message.guild.id }, { $pull: { badwords: { $in: words } } });
                    const doc = await Automod.findById(message.guild.id).lean();
                    if (doc) automodCache.set(message.guild.id, doc);
                    return client.util.container(message, `# Badwords Removed\n-# Removed: ${words.map((w) => `\`${w}\``).join(", ")}`);
                }

                if (action === "list") {
                    const doc = await Automod.findById(message.guild.id).lean();
                    const list = doc?.badwords ?? [];
                    return client.util.container(message, list.length
                        ? `## Badword List (${list.length})\n\n${list.map((w) => `\`${w}\``).join(", ")}`
                        : `# Badwords\n-# No badwords configured.`);
                }

                if (action === "reset") {
                    await Automod.updateOne({ _id: message.guild.id }, { $set: { badwords: [] } });
                    const doc = await Automod.findById(message.guild.id).lean();
                    if (doc) automodCache.set(message.guild.id, doc);
                    return client.util.container(message, `# Badwords Reset\n-# All filtered words have been cleared.`);
                }

                return client.util.container(message,
                    `## Badword Commands\n\n` +
                    `\`${prefix}automod badwords add <word>\`\n` +
                    `\`${prefix}automod badwords remove <word>\`\n` +
                    `\`${prefix}automod badwords list\`\n` +
                    `\`${prefix}automod badwords reset\``,
                );
            }

            case "action": {
                const choice = args[1]?.toLowerCase();
                if (!["delete", "mute", "timeout"].includes(choice)) {
                    return client.util.container(message, `Usage: \`${prefix}automod action delete|mute\``);
                }
                await Automod.updateOne({ _id: message.guild.id }, { $set: { action: choice } }, { upsert: true });
                const doc = await Automod.findById(message.guild.id).lean();
                automodCache.set(message.guild.id, doc);
                return client.util.container(message, `# Automod Action Set\n-# Action for violations: **${choice}**.`);
            }

            case "status":
            case "config": {
                const doc = await Automod.findById(message.guild.id).lean();
                if (!doc) return client.util.container(message, `# Automod Not Configured\n-# Use \`${prefix}automod enable\` to get started.`);

                const text =
                    `## Automod — Status\n\n` +
                    `**Enabled:** ${doc.enabled ? "Yes" : "No"}\n` +
                    `**Anti-Link:** ${doc.antilink ? "On" : "Off"}\n` +
                    `**Anti-Invite:** ${doc.antiinvite ? "On" : "Off"}\n` +
                    `**Anti-Spam:** ${doc.antispam ? "On" : "Off"}\n` +
                    `**Spam Limit:** ${doc.spamLimit ?? 5} msg/5s\n` +
                    `**Action:** ${doc.action || "delete"}\n` +
                    `**Badwords:** ${doc.badwords?.length ?? 0}\n` +
                    `**Whitelisted URLs:** ${doc.whitelist?.length ?? 0}\n` +
                    `**Immune Roles:** ${doc.immuneRoles?.length ?? 0}`;

                return client.util.container(message, text);
            }

            default: {
                return client.util.container(message,
                    `## Automod Commands\n\n` +
                    `\`${prefix}automod enable|disable\` — Toggle automod\n` +
                    `\`${prefix}automod status\` — View configuration\n` +
                    `\`${prefix}automod antilink on|off\` — Filter links\n` +
                    `\`${prefix}automod antiinvite on|off\` — Filter Discord invites\n` +
                    `\`${prefix}automod antispam on|off [limit]\` — Filter spam\n` +
                    `\`${prefix}automod badwords add|remove|list|reset\` — Manage filtered words\n` +
                    `\`${prefix}automod action delete|mute\` — Set action on violations`,
                );
            }
        }
    },
};
