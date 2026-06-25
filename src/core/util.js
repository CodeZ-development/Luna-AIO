const {
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    SeparatorBuilder,
    MessageFlags,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const antinuke   = require("../models/antinuke.js");
const AntiNukeMemory = require("../core/antinukeMemory");

module.exports = class Util {
    constructor(client) {
        this.client = client;
    }

    async parse(content, member) {
        const mention = `<@${member.user.id}>`;
        return content
            .replaceAll(/\\n/g, "\n")
            .replaceAll(/{server}/g, member.guild.name)
            .replaceAll(/{count}/g, member.guild.memberCount)
            .replaceAll(/{member:name}/g, member.displayName)
            .replaceAll(/{member:mention}/g, mention)
            .replaceAll(/{member:id}/g, member.user.id)
            .replaceAll(/{member:created_at}/g, `<t:${Math.round(member.user.createdTimestamp / 1000)}:R>`);
    }

    async isExtraOwner(member, guild) {
        const data = AntiNukeMemory.get(guild.id);
        if (!data) return false;
        return data.extraOwners?.has(member.id) ?? false;
    }

    isHex(text) {
        return /^#[0-9A-F]{6}$/i.test(text);
    }

    hasHigher(member) {
        if (
            member.roles.highest.position <= member.guild.members.me.roles.highest.position &&
            member.user.id !== member.guild.ownerId
        ) return false;
        return true;
    }

    countCommands() {
        let total = 0;
        const seen = new Set();
        this.client.commands.forEach((cmd) => {
            if (seen.has(cmd.name)) return;
            seen.add(cmd.name);
            total++;
        });
        return total;
    }

    formatBytes(bytes) {
        if (bytes === 0) return "0 Bytes";
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
    }

    async setPrefix(message) {
        let prefix = await this.client.db.get(`prefix_${message?.guild?.id}`);
        if (prefix === null) prefix = "?";
        message.guild.prefix = prefix;
    }

    async noprefix() {
        const data = (await this.client.db.get("noprefix_users")) || [];
        this.client.noprefix     = Object.keys(data);
        this.client.noprefixData = data;
    }

    async blacklist() {
        const data = (await this.client.db.get("blacklist_user")) || [];
        this.client.blacklist = Object.keys(data);
    }

    async blacklistserver() {
        const data = (await this.client.db.get("blacklist_server")) || [];
        this.client.blacklistserver = Object.keys(data);
    }

    async BlacklistCheck(guild) {
        const data = this.client.blacklistserver || [];
        return data.includes(guild.id);
    }

    async MaintananceCheck() {
        const main = (await this.client.db.get("luna_maintenance")) || false;
        this.client.maintenance = main;
    }

    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async handleRateLimit() {
        this.ratelimitActive = true;
        await this.sleep(5000);
        this.ratelimitActive = false;
    }

    embed() {
        return new EmbedBuilder();
    }

    async container(message, text) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(text));

        try {
            return await message.reply({
                flags: MessageFlags.IsComponentsV2,
                components: [container],
                allowedMentions: { repliedUser: true },
            });
        } catch {
            return await message.channel.send({
                flags: MessageFlags.IsComponentsV2,
                components: [container],
                allowedMentions: { parse: [] },
            });
        }
    }

    Textcontainer(text) {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
        return container;
    }

    async lunaPagination(membersList, title, client, message) {
        const lodash = require("lodash");
        const pages  = lodash.chunk(membersList, 10);
        let currentPage = 0;

        const generateContainer = () => {
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${title}\n${pages[currentPage].join("\n")}\n-# Page ${currentPage + 1}/${pages.length}`,
                ),
            );
            return container;
        };

        if (pages.length === 0) {
            return message.channel.send({
                flags: MessageFlags.IsComponentsV2,
                components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent("No members found."))],
            });
        }

        if (pages.length === 1) {
            return message.channel.send({
                flags: MessageFlags.IsComponentsV2,
                components: [generateContainer()],
            });
        }

        const back    = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("pg_back").setLabel("< Prev").setDisabled(true);
        const forward = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("pg_next").setLabel("Next >");
        const stop    = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("pg_stop").setLabel("Stop");
        const row     = new ActionRowBuilder().addComponents(back, stop, forward);

        const buildComponents = () => {
            const c = generateContainer();
            c.addActionRowComponents(new ActionRowBuilder().addComponents(
                new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("pg_back").setLabel("< Prev").setDisabled(currentPage === 0),
                new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("pg_stop").setLabel("Stop"),
                new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId("pg_next").setLabel("Next >").setDisabled(currentPage === pages.length - 1),
            ));
            return c;
        };

        const msg = await message.channel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [buildComponents()],
        });

        const collector = msg.createMessageComponentCollector({
            filter: (i) => i.isButton() && i.user.id === message.member.id,
            time: 60000,
        });

        collector.on("collect", async (b) => {
            if (b.customId === "pg_back" && currentPage > 0) currentPage--;
            else if (b.customId === "pg_next" && currentPage < pages.length - 1) currentPage++;
            else if (b.customId === "pg_stop") { collector.stop(); return b.deferUpdate(); }
            await b.update({ flags: MessageFlags.IsComponentsV2, components: [buildComponents()] });
        });

        collector.on("end", () => {
            msg.edit({
                flags: MessageFlags.IsComponentsV2,
                components: [generateContainer()],
            }).catch(() => {});
        });
    }

    async CheckPremium() {
        return false;
    }

    codeText(text, type = "js") {
        return `\`\`\`${type}\n${text}\`\`\``;
    }

    removeDuplicates(arr) {
        return [...new Set(arr)];
    }
};
