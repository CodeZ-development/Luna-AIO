module.exports = function registerErrorHandlers(client) {
    process.on("uncaughtException", (err) => {
        client.logger.error(`[UncaughtException] ${err.message}`);
        console.error(err);
    });

    process.on("unhandledRejection", (reason) => {
        client.logger.error(`[UnhandledRejection] ${reason}`);
        console.error(reason);
    });
};
