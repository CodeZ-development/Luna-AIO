const mongoose = require("mongoose");

const AutoroleSchema = new mongoose.Schema(
    {
        _id:    { type: String, required: true },
        roles:  { type: [String], default: [] },
        bots:   { type: [String], default: [] },
        enabled: { type: Boolean, default: false },
    },
    { timestamps: true },
);

module.exports = mongoose.model("Autorole", AutoroleSchema);
