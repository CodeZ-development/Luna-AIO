const Antinuke = require("../models/antinuke");
const cache = require("./antinukeMemory");
const buildGuildCache = require("./buildGuildCache");

async function loadAntiNuke() {
    const docs = await Antinuke.find({ enabled: true }).lean();
    for (const doc of docs) {
        cache.set(doc._id, buildGuildCache(doc));
    }
    console.log(`[Luna] Loaded ${docs.length} guild antinuke configs into memory`);
}

async function updateGuildAntiNuke(guildId) {
    let doc = await Antinuke.findById(guildId).lean();
    if (!doc) {
        doc = await Antinuke.create({ _id: guildId, enabled: true });
        doc = doc.toObject();
        console.log(`[Luna] Created new antinuke config for ${guildId}`);
    }
    cache.set(guildId, buildGuildCache(doc));
    console.log(`[Luna] Updated antinuke cache for ${guildId}`);
}

module.exports = { loadAntiNuke, updateGuildAntiNuke };
