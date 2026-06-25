require("module-alias/register");

const Luna = require("./core/Client");
const client = new Luna();

client.init().catch((err) => {
    client.logger.error(`Startup failed — ${err.message}`);
    console.error(err);
});
