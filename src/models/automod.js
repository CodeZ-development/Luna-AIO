const mongoose = require("mongoose");

const AutomodSchema = new mongoose.Schema(
    {
        _id:       { type: String, required: true },
        enabled:   { type: Boolean, default: false },
        badwords:  { type: [String], default: [] },
        antilink:  { type: Boolean, default: false },
        antiinvite: { type: Boolean, default: false },
        antispam:  { type: Boolean, default: false },
        spamLimit: { type: Number, default: 5 },
        logChannel: { type: String, default: null },
        whitelist: { type: [String], default: [] },
        immuneRoles: { type: [String], default: [] },
        action:    { type: String, default: "delete" },
    },
    { timestamps: true },
);

module.exports = mongoose.model("Automod", AutomodSchema);
