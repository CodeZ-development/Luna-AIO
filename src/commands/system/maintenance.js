module.exports = {
    name: "maintenance",
    aliases: ["maint"],
    category: "system",
    cooldown: 3,

    run: async (client, message, args) => {
        if (!client.config.owner.includes(message.author.id)) {
            return client.util.container(message, `# Access Denied\n-# This command is restricted to bot owners.`);
        }

        const toggle = args[0]?.toLowerCase();
        if (!["on", "off"].includes(toggle)) {
            const current = client.maintenance ? "On" : "Off";
            return client.util.container(message, `# Maintenance Mode\n-# Current: **${current}**\n-# Usage: \`${message.guild.prefix || "?"}maintenance on|off\``);
        }

        const val = toggle === "on";
        await client.db.set("luna_maintenance", val);
        client.maintenance = val;

        return client.util.container(message,
            val
                ? `# Maintenance Mode — Active\n-# All non-owner commands are now disabled.`
                : `# Maintenance Mode — Deactivated\n-# All commands are restored to normal.`,
        );
    },
};
