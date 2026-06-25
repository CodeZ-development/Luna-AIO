const { inspect } = require("util");

module.exports = {
    name: "eval",
    aliases: ["ev"],
    category: "system",
    cooldown: 0,

    run: async (client, message, args) => {
        if (!client.config.owner.includes(message.author.id)) {
            return client.util.container(message, `# Access Denied\n-# This command is restricted to bot owners.`);
        }

        const code = args.join(" ");
        if (!code) return client.util.container(message, `# Eval\n-# Provide code to execute.`);

        try {
            let result = eval(code);
            if (result instanceof Promise) result = await result;
            if (typeof result !== "string") result = inspect(result, { depth: 2 });
            const output = result.slice(0, 3800);
            return client.util.container(message, `## Eval — Output\n\`\`\`js\n${output}\`\`\``);
        } catch (err) {
            return client.util.container(message, `## Eval — Error\n\`\`\`js\n${err.message}\`\`\``);
        }
    },
};
