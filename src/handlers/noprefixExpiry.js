const NP_KEY = "noprefix_users";

const now = () => Math.floor(Date.now() / 1000);

class NoPrefixExpiryService {
    constructor(client, options = {}) {
        this.client     = client;
        this.intervalMs = options.intervalMs || 60_000;
        this.timer      = null;
    }

    async start() {
        if (!this.client.noprefixData) await this.client.util.noprefix();
        if (this.timer) return;

        this.timer = setInterval(() => this.check(), this.intervalMs);
        this.client.logger.log(`[Luna] No-prefix expiry service started (every ${this.intervalMs / 1000}s)`);
    }

    async check() {
        try {
            const data = this.client.noprefixData;
            if (!data) return;

            let changed = false;
            for (const userId in data) {
                const entry = data[userId];
                if (!entry.expiresAt) continue;
                if (entry.expiresAt <= now()) {
                    delete data[userId];
                    changed = true;
                    this.client.logger.warn(`[Luna] No-prefix expired for ${userId}`);
                }
            }

            if (changed) {
                await this.client.db.set(NP_KEY, data);
                await this.client.util.noprefix();
            }
        } catch (err) {
            this.client.logger.error(`[Luna] No-prefix expiry error: ${err.message}`);
        }
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

module.exports = NoPrefixExpiryService;
