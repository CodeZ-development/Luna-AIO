const fs   = require("fs");
const path = require("path");

module.exports = async function loadCommands(client) {
    let count = 0;
    const base = path.join(process.cwd(), "src/commands");
    const dirs  = fs.readdirSync(base);

    for (const dir of dirs) {
        if (dir === "helpers") continue;

        const dirPath = path.join(base, dir);
        if (!fs.statSync(dirPath).isDirectory()) continue;

        const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".js"));

        for (const file of files) {
            try {
                const command = require(path.join(dirPath, file));
                if (!command.name) continue;
                client.commands.set(command.name, { directory: dir, ...command });
                if (command.aliases) {
                    for (const alias of command.aliases) {
                        client.commands.set(alias, { directory: dir, ...command });
                    }
                }
                count++;
            } catch (err) {
                client.logger.error(`Failed to load command ${file}: ${err.message}`);
            }
        }
    }

    client.logger.update(`Commands loaded: ${count}`);
};
