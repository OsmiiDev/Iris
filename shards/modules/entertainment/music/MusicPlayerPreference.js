const { ButtonInteraction } = require("discord.js");
const ytdl = require("ytdl-core");

const DataUtils = require("../../../utility/DataUtils");
const MessageUtils = require("../../../utility/MessageUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");
const PermissionUtils = require("../../../utility/PermissionUtils");

const IrisModule = require("../../IrisModule");

class MusicPlayPreference extends IrisModule {

    LISTENERS = [
        { event: "interactionCreate", function: this.likeButton },
        { event: "interactionCreate", function: this.dislikeButton }
    ];

    constructor() {
        super("entertainment.music.MusicPlayerPreference");
        this.registerEvents();
    }

    /**
     * @param {ButtonInteraction} interaction The button click
    */
    async likeButton(interaction) {
        if (!interaction.isButton() || !interaction.guild || !interaction.member || interaction.customId !== "25c565aa300c-80e0f1c2") { return; }
        if (!PermissionUtils.hasPermission(interaction.member, "MUSIC_PLAYER_USE")) { return; }
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MUSIC_PLAYER)) { return; }

        if (!interaction.message || !interaction.message.member || interaction.message.member !== interaction.guild.me) { return; }

        let file = interaction.message.attachments ? interaction.message.attachments.first() : null;
        if (!file) { return; }

        let url = `https://youtube.com/watch?${Buffer.from(file.name.split(".")[0], 'base64').toString('ascii')}`;

        let information = await ytdl.getInfo(url).catch(() => { });
        if (!information || !information.videoDetails) { return; }
        information = information.videoDetails;

        let properties = ["title", "lengthSeconds", "externalChannelId", "isFamilySafe", "viewCount", "category", "publishDate", "ownerChannelName", "uploadDate", "videoId", "keywords", "channelId", "likes", "age_restricted", "video_url"];
        let videoInformation = Object.fromEntries(Object.entries(information).filter((value) => properties.includes(value[0])));

        let liked = DataUtils.readUser(interaction.user, "entertainment/music/liked", {});
        let disliked = DataUtils.readUser(interaction.user, "entertainment/music/disliked", {});

        if (!liked[interaction.guild.id]) { liked[interaction.guild.id] = []; }

        if (liked[interaction.guild.id].find(video => video.videoId === videoInformation.videoId)) {
            liked[interaction.guild.id] = liked[interaction.guild.id].filter(video => video.videoId !== videoInformation.videoId);
            interaction.reply({
                embeds: [
                    MessageUtils.generateEmbed(`<:Iris_Confirm:973076220516388874> Removed ${videoInformation.title} from your liked songs.`,
                        "Undo this by pressing the like button again.", "#4466DD")
                ], ephemeral: true
            });
        }
        else {
            if (disliked[interaction.guild.id] && disliked[interaction.guild.id].find(video => video.videoId === videoInformation.videoId)) {
                disliked[interaction.guild.id] = disliked[interaction.guild.id].filter(video => video.videoId !== videoInformation.videoId);
                DataUtils.writeUser(interaction.user, "entertainment/music/disliked", disliked);
            }

            liked[interaction.guild.id].push(videoInformation);
            interaction.reply({
                embeds: [
                    MessageUtils.generateEmbed(`<:Iris_Confirm:973076220516388874> Added ${videoInformation.title} to your liked songs`,
                        "This and similar music will be suggested more often. Undo this by pressing the like button again.", "#4466DD")
                ], ephemeral: true
            });
        }

        DataUtils.writeUser(interaction.user, "entertainment/music/liked", liked);
    }

    /**
     * @param {ButtonInteraction} interaction The button click
    */
    async dislikeButton(interaction) {
        if (!interaction.isButton() || !interaction.guild || !interaction.member || interaction.customId !== "25c565aa300c-a760b098") { return; }
        if (!PermissionUtils.hasPermission(interaction.member, "MUSIC_PLAYER_USE")) { return; }
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MUSIC_PLAYER)) { return; }

        if (!interaction.message || !interaction.message.member || interaction.message.member !== interaction.guild.me) { return; }

        let file = interaction.message.attachments ? interaction.message.attachments.first() : null;
        if (!file) { return; }

        let url = `https://youtube.com/watch?${Buffer.from(file.name.split(".")[0], 'base64').toString('ascii')}`;

        let information = await ytdl.getInfo(url).catch(() => { });
        if (!information || !information.videoDetails) { return; }
        information = information.videoDetails;

        let properties = ["title", "lengthSeconds", "externalChannelId", "isFamilySafe", "viewCount", "category", "publishDate", "ownerChannelName", "uploadDate", "videoId", "keywords", "channelId", "likes", "age_restricted", "video_url"];
        let videoInformation = Object.fromEntries(Object.entries(information).filter((value) => properties.includes(value[0])));

        let disliked = DataUtils.readUser(interaction.user, "entertainment/music/disliked", {});
        let liked = DataUtils.readUser(interaction.user, "entertainment/music/liked", {});

        if (!disliked[interaction.guild.id]) { disliked[interaction.guild.id] = []; }

        if (disliked[interaction.guild.id].find(video => video.videoId === videoInformation.videoId)) {
            disliked[interaction.guild.id] = disliked[interaction.guild.id].filter(video => video.videoId !== videoInformation.videoId);
            interaction.reply({
                embeds: [
                    MessageUtils.generateEmbed(`<:Iris_Confirm:973076220516388874> Removed ${videoInformation.title} from your disliked songs.`,
                        "Undo this by pressing the dislike button again.", "#4466DD")
                ], ephemeral: true
            });
        }
        else {
            if (liked[interaction.guild.id] && liked[interaction.guild.id].find(video => video.videoId === videoInformation.videoId)) {
                liked[interaction.guild.id] = liked[interaction.guild.id].filter(video => video.videoId !== videoInformation.videoId);
                DataUtils.writeUser(interaction.user, "entertainment/music/liked", liked);
            }

            disliked[interaction.guild.id].push(videoInformation);
            interaction.reply({
                embeds: [
                    MessageUtils.generateEmbed(`<:Iris_Confirm:973076220516388874> Added ${videoInformation.title} to your disliked songs.`,
                        "This and similar music will be suggested less often. Undo this by pressing the dislike button again.", "#4466DD")
                ], ephemeral: true
            });
        }

        DataUtils.writeUser(interaction.user, "entertainment/music/disliked", disliked);
    }
}

module.exports = MusicPlayPreference;