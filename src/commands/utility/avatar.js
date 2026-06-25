const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

module.exports = {
    name: "avatar",
    aliases: ["av", "pfp"],
    category: "utility",
    cooldown: 3,

    run: async (client, message, args) => {
        const target = message.mentions.users.first() ||
            await client.users.fetch(args[0]?.replace(/[<@!>]/g, "") || message.author.id).catch(() => null) ||
            message.author;

        const url512  = target.displayAvatarURL({ extension: "png", size: 512 });
        const url4096 = target.displayAvatarURL({ extension: "png", size: 4096 });

        const container = new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `## ${target.tag}\n-# Click the image to open full size\n[View Full Size (4096)](${url4096})`,
                    ))
                    .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: url512 } })),
            );

        return message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
    },
};
