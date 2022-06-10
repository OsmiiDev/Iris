const { ButtonInteraction } = require("discord.js");

const PermissionUtils = require("../../../utility/PermissionUtils");
const MessageUtils = require("../../../utility/MessageUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");

const MusicPlayer = ModuleUtils.getModule("entertainment.music.MusicPlayer");

const IrisModule = ModuleUtils.getModule("core.IrisModule");

class MusicPlayerQueue extends IrisModule {

    LISTENERS = [
        { event: "interactionCreate", function: this.viewQueue }
    ];

    constructor() {
        super("entertainment.music.MusicPlayerQueue");
        this.registerEvents();

    }

    /**
     * @description Displays the queue
     * @param {ButtonInteraction} interaction 
     * @param {Number} page The page number to display
    */
    async viewQueue(interaction, page) {
        if (!interaction.isButton() || !interaction.guild || !interaction.member || interaction.customId !== "25c565aa300c-42f2ccd6") { return; }
        if (!PermissionUtils.hasPermission(interaction.member, "MUSIC_PLAYER_USE")) { return; }
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MUSIC_PLAYER)) { return; }

        let [queueInfo, settings] = MusicPlayer.getQueue(interaction.guild) || [[], {}];
        if (!queueInfo) { queueInfo = []; }
        if (!settings) { settings = {}; }

        let description = "";

        if (queueInfo.length === 0) { description = "*No songs in queue. Use `/music play <song>` to get started.*"; }
        else { description = `**Currently playing:** [${queueInfo[0].data.title}](${queueInfo[0].data.url})\n`; }

        queueInfo.forEach((item, index) => {
            if (index === 0) { return; }
            if (index === 1) { return description += `**Playing next:** [${item.data.title}](${item.data.url})\n\n`; }
            if (page && index < page * 15 || index > page * 15 + 15) { return; }

            description += `**\`${index - 1}\`** [${item.data.title}](${item.url})\n`;
        });

        let queueEmbed = MessageUtils.generateEmbed(settings.loop ? "Queue (Looping)" : "Queue", description, "#4466DD", interaction.user).setFooter({ text: "Iris Music" }).setTimestamp();

        interaction.reply({ embeds: [queueEmbed] });
    }
}

module.exports = MusicPlayerQueue;