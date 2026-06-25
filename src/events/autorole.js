const Autorole = require("../models/autorole");

module.exports = (client) => {
    client.on("guildMemberAdd", async (member) => {
        try {
            const data = await Autorole.findById(member.guild.id);
            if (!data?.enabled) return;

            const roles = member.user.bot ? data.bots : data.roles;
            if (!roles?.length) return;

            for (const roleId of roles) {
                const role = member.guild.roles.cache.get(roleId);
                if (!role || !role.editable) continue;
                await member.roles.add(role, "Luna: Autorole").catch(() => {});
            }
        } catch {}
    });
};
