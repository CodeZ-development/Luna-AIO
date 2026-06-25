const AntiNukeMemory = require("../../core/antinukeMemory");

module.exports = {
    name: "checkantinuke",
    aliases: ["can", "anstatus"],
    category: "security",
    cooldown: 5,

    run: async (client, message) => {
        const g = AntiNukeMemory.get(message.guild.id);

        if (!g?.enabled) {
            return client.util.container(message, `# Antinuke — Not Active\n-# Antinuke is not enabled on this server.\n-# Use \`${message.guild.prefix || "?"}antinuke enable\` to set it up.`);
        }

        const unbypassRole   = g.unbypassRoleId ? message.guild.roles.cache.get(g.unbypassRoleId) : null;
        const quarantineRole = g.quarantineRoleId ? message.guild.roles.cache.get(g.quarantineRoleId) : null;
        const botHasUnbypass = unbypassRole && message.guild.members.me.roles.cache.has(unbypassRole.id);

        const lines = [
            `# Antinuke — Quick Check`,
            `**Status:** Active`,
            `**Punishment:** ${g.punishment || "ban"}`,
            `**Log Channel:** ${g.logChannel ? `<#${g.logChannel}>` : "Not set"}`,
            `**Panic Mode:** ${g.panic ? "Active" : "Inactive"}`,
            `**Unbypass Role:** ${unbypassRole ? `${unbypassRole.name}` : "Missing — run antinuke repair"}`,
            `**Luna has unbypass:** ${botHasUnbypass ? "Yes" : "No — run antinuke repair"}`,
            `**Quarantine Role:** ${quarantineRole ? `${quarantineRole.name}` : "Not created (created on first quarantine)"}`,
            `**Whitelist:** ${g.whitelist?.size ?? 0} entries`,
            `**Extra Owners:** ${g.extraOwners?.size ?? 0}`,
            `**Active Modules:** ${Object.values(g.modules ?? {}).filter(Boolean).length}/14`,
        ];

        return client.util.container(message, lines.join("\n"));
    },
};
