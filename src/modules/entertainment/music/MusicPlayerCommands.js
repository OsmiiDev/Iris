const {MessageButton, MessageActionRow} = require("discord.js");
const ytdl = require("ytdl-core");
const playdl = require("play-dl");

const DataUtils = require("../../../utility/DataUtils");
const MessageUtils = require("../../../utility/MessageUtils");
const PermissionUtils = require("../../../utility/PermissionUtils");

const MusicPlayer = require("./MusicPlayer");

const IrisModule = require("../../../modules/IrisModule");

/**
 * @description Handles commands
*/
class MusicPlayerCommands extends IrisModule {
    LISTENERS = [];

    /**
     * @description Constructor
    */
    constructor() {
        super("entertainment.music.MusicPlayerCommands");
        this.registerEvents();
    }

    /**
     * @param {CommandInteraction} interaction The command interaction object
     * @param {String} song The URL or ID of the video (https://youtube.com/watch?v=ID, etc.)
     * @param {String} queue The position in the queue to place the video
     * @description Plays a video
    */
    static async play(interaction, song, queue) {
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MUSIC_PLAYER)) {
            return;
        }

        let url;

        if (song.match(/^(http(s)?:\/\/)?(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9-_]){11}/g)) {
            url = song;
        } else if (song.match(/^(http(s)?:\/\/)?(www\.)?youtu\.be\/([a-zA-Z0-9-_]){11}/g)) {
            url = song;
        } else if (song.match(/^(http(s)?:\/\/)?(www\.)?youtube\.com\/v\/([a-zA-Z0-9-_]){11}/g)) {
            url = song;
        } else if (song.match(/^(http(s)?:\/\/)?(www\.)?open\.spotify\.com\/track\/([a-zA-Z0-9-_]){22}/g)) {
            url = song;
        }


        if (!queue) {
            queue = "Last";
        }

        if (!interaction.member.voice.channel) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("You must be connected to a voice channel to run this command.")]});
        }

        if (interaction.guild.me.voice.channel && interaction.guild.me.voice.channelId !== interaction.member.voice.channelId) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("You must be connected to the same channel as me to run this command.")]});
        }

        const whitelist = DataUtils.getConfig(interaction.guild).modules.entertainment.music["whitelisted-voice-channels"];

        if (!interaction.guild.me.voice.channel && !interaction.member.permissions.has("MOVE_MEMBERS") && !whitelist.includes(interaction.member.voice.channelId)) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("Sorry, you can't play music in that voice channel.")]});
        }

        let youtubeResults;
        if (!url) {
            youtubeResults = await playdl.search(song, {source: {youtube: "video"}, limit: 10});
            if (!youtubeResults || youtubeResults.length === 0) {
                return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("No results found.")]});
            }
            url = youtubeResults[0].url;
        }

        let information = await ytdl.getInfo(url).catch(() => { });

        if (!information || !information.videoDetails) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("Failed to fetch the song information.")]});
        }

        information = information.videoDetails;

        if (queue === "Now") {
            MusicPlayer.updateQueue(interaction.guild, {url, data: information}, 0, interaction.member.voice.channel);
        }
        if (queue === "Next") {
            MusicPlayer.updateQueue(interaction.guild, {url, data: information}, 1, interaction.member.voice.channel);
        }
        if (queue === "Last") {
            MusicPlayer.updateQueue(interaction.guild, {url, data: information}, -1, interaction.member.voice.channel);
        }

        const history = DataUtils.readUser(interaction.user, "entertainment/music/history", {});
        if (!history[interaction.guild.id]) {
            history[interaction.guild.id] = [];
        }

        const properties = [
            "title",
            "lengthSeconds",
            "externalChannelId",
            "isFamilySafe",
            "viewCount",
            "category",
            "publishDate",
            "ownerChannelName",
            "uploadDate",
            "videoId",
            "keywords",
            "channelId",
            "likes",
            "age_restricted",
            "video_url"];
        const videoInformation = Object.fromEntries(Object.entries(information).filter((value, index) => properties.includes(value[0])));

        history[interaction.guild.id].push({url, timestamp: new Date().getTime(), data: videoInformation});
        DataUtils.writeUser(interaction.user, "entertainment/music/history", history);

        const viewQueueButton = new MessageButton().setCustomId("25c565aa300c-42f2ccd6").setLabel("View Queue").setEmoji("<:Iris_Playlist:981984427733307422>").setStyle("PRIMARY");

        const buttons = new MessageActionRow().addComponents(viewQueueButton);

        const notMusicWarning = information.category === "Music" ? "" : "\n\n<:Iris_Information:982364440651522088> This video is not tagged as Music.";
        if (youtubeResults) {
            interaction.reply({
                embeds: [
                    MessageUtils.generateEmbed(`Added to queue: ${information.title}`,
                        `[Watch on YouTube](${url}) | [Subscribe to creator](https://www.youtube.com/channel/${information.channelId}?sub_confirmation=1)\n
                    **Uploaded by:** ${information.author.name.endsWith(" - Topic") ? information.author.name.split(" - ")[0] : information.author.name}
                    **Uploaded on:** ${new Date(information.uploadDate).toLocaleDateString()}

                    Not the song you wanted ? Here are some more results.
                    ${youtubeResults.map((item, index) => `**\`${index + 1}\`** ${item.title}`).join("\n")}${notMusicWarning}`,
                        "#4466DD", interaction.user).setThumbnail(information.thumbnails[information.thumbnails.length - 1].url).setFooter({text: "Iris Music"}).setTimestamp()
                ],
                components: [buttons]
            });
        } else {
            interaction.reply({
                embeds: [
                    MessageUtils.generateEmbed(`Added to queue: ${information.title}`,
                        `[Watch on YouTube](${url}) | [Subscribe to creator](https://www.youtube.com/channel/${information.channelId}?sub_confirmation=1)\n
                    **Uploaded by:** ${information.author.name.endsWith(" - Topic") ? information.author.name.split(" - ")[0] : information.author.name}
                    **Uploaded on:** ${new Date(information.uploadDate).toLocaleDateString()}${notMusicWarning}`,
                        "#4466DD", interaction.user).setThumbnail(information.thumbnails[information.thumbnails.length - 1].url).setFooter({text: "Iris Music"}).setTimestamp()
                ],
                components: [buttons]
            });
        }
    }

    /**
     * @description Skips the current playing song and moves on to the next one
     * @param {CommandInteraction} interaction The command interaction
    */
    static async skip(interaction) {
        if (!interaction.guild.me.permissions.has("ADMINISTRATOR")) {
            return;
        }

        if (!interaction.member.voice.channel) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("You must be connected to a voice channel to run this command.")]});
        }

        if (interaction.guild.me.voice.channel && interaction.guild.me.voice.channelId !== interaction.member.voice.channelId) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("You must be connected to the same channel as me to run this command.")]});
        }

        MusicPlayer.updateQueue(interaction.guild, {url: "", data: ""}, -2, interaction.member.voice.channel);

        interaction.reply({
            embeds: [
                MessageUtils.generateEmbed("Skipped current song and playing next song in queue...", "",
                    "#4466DD", interaction.user).setFooter({text: "Iris Music"}).setTimestamp()
            ]
        });
    }

    /**
     * @description Toggles the loop mode
     * @param {CommandInteraction} interaction The command interaction
    */
    static async loop(interaction) {
        if (!interaction.guild.me.permissions.has("ADMINISTRATOR")) {
            return;
        }

        if (!interaction.member.voice.channel) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("You must be connected to a voice channel to run this command.")]});
        }

        if (interaction.guild.me.voice.channel && interaction.guild.me.voice.channelId !== interaction.member.voice.channelId) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("You must be connected to the same channel as me to run this command.")]});
        }

        const loop = MusicPlayer.toggleLoop(interaction.guild);

        if (loop) {
            const queueEmbed = MessageUtils.generateEmbed(
                "Now looping the current queue",
                "When the queue empties, it will replay from the beginning.",
                "#4466DD", interaction.user).setFooter({text: "Iris Music"}).setTimestamp();

            interaction.reply({embeds: [queueEmbed]});
        } else {
            interaction.reply({embeds: [MessageUtils.generateEmbed("Stopped looping the current queue", "", "#4466DD", interaction.user).setFooter({text: "Iris Music"}).setTimestamp()]});
        }
    }

    /**
     * @description Views the current queue
     * @param {CommandInteraction} interaction The command interaction
    */
    static async queue(interaction) {
        let [queueInfo, settings] = MusicPlayer.getQueue(interaction.guild) || [[], {}];
        if (!queueInfo) {
            queueInfo = [];
        }
        if (!settings) {
            settings = {};
        }

        let description = "";

        if (queueInfo.length === 0) {
            description = "*No songs in queue. Use `/music play <song>` to get started.*";
        } else {
            description = `**Currently playing:** [${queueInfo[0].data.title}](${queueInfo[0].data.url})\n`;
        }

        const page = 0;

        queueInfo.forEach((item, index) => {
            if (index === 0) {
                return;
            }
            if (index === 1) {
                return description += `**Playing next:** [${item.data.title}](${item.data.url})\n\n`;
            }
            if (page && index < page * 15 || index > page * 15 + 15) {
                return;
            }

            description += `**\`${index - 1}\`** [${item.data.title}](${item.url})\n`;
        });

        const queueEmbed = MessageUtils.generateEmbed(settings.loop ? "Queue (Looping)" : "Queue", description, "#4466DD", interaction.user).setFooter({text: "Iris Music"}).setTimestamp();

        interaction.reply({embeds: [queueEmbed]});
    }
}

module.exports = MusicPlayerCommands;
