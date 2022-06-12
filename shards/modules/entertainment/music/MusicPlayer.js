const { VoiceChannel, Message, Guild, GuildMember, GuildChannel, MessageButton, MessageActionRow, MessageAttachment } = require("discord.js");
const voice = require("@discordjs/voice");
const playdl = require("play-dl");
const ytdl = require("ytdl-core");

const DataUtils = require("../../../utility/DataUtils");
const MessageUtils = require("../../../utility/MessageUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");
const PermissionUtils = require("../../../utility/PermissionUtils");
const { Canvas } = require("canvas");

let players = {};
let queues = {};
let settings = {};
let idleTimers = {};

const crypto = require("crypto");
const IrisModule = require("../../IrisModule");

class MusicPlayer extends IrisModule {

    LISTENERS = [];

    connection;

    constructor() {
        super("entertainment.music.MusicPlayer");
        this.registerEvents();
    }

    /**
     * @description Waits for a number of milliseconds
     * @param {Number} ms The number of milliseconds to sleep 
    */
    static async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * @description Updates a guild's queue
     * @param {Guild} guild The guild to update the queue for 
     * @param {Object} info The information of the video to play
     * @param {Number} position The position in the queue to play the video at
     * @param {VoiceChannel} channel The voice channel to add to the queue
     * @returns {Object} The guild's current music queue
    */
    static async updateQueue(guild, info, position, channel) {
        if (!PermissionUtils.botPermission(channel, PermissionUtils.PermissionGroups.MUSIC_PLAYER)) { return connection.destroy(); }

        if (!queues[guild.id]) {
            queues[guild.id] = [];
            players[guild.id] = new voice.AudioPlayer();

            players[guild.id].on("stateChange", async (previous, current) => {
                if (players[guild.id].errorLock) { return players[guild.id].errorLock = false; }
                if (current.status === voice.AudioPlayerStatus.Idle && previous.status !== voice.AudioPlayerStatus.Idle) {
                    console.log("Idled");

                    idleTimers[guild.id] = new Date().getTime();

                    MusicPlayer.playNext(guild);
                }
                else if (current.status === voice.AudioPlayerStatus.Playing) {
                    console.log("Playing");
                    idleTimers[guild.id] = 0;
                }
            });

            players[guild.id].on("error", async (error) => {
                players[guild.id].errorLock = true;

                if (!PermissionUtils.botPermission(channel, PermissionUtils.PermissionGroups.MUSIC_PLAYER)) { return connection.destroy(); }

                let item = queues[guild.id][0];
                if (item) {
                    players[guild.id].play(voice.createAudioResource(ytdl(item.url, { filter: 'audioonly' })));
                }

                let logChannel = await guild.channels.fetch(DataUtils.getConfig(guild).modules.entertainment.music['public-log-channel']);
                if (logChannel instanceof GuildChannel) {
                    logChannel.send({ embeds: [MessageUtils.generateErrorEmbed("Something went wrong. Attempting to replay the current song.")] });
                }
            });
        }

        if (position === -2) {
            if (!queues[guild.id] || queues[guild.id].length <= 1) {
                players[guild.id].stop();
                return [];
            }

            MusicPlayer.playNext(guild);
            return queues[guild.id];
        }
        else if (position === -1) {
            queues[guild.id].push(info);
        }
        else if (position >= 0) {
            queues[guild.id].splice(position, 0, info);
        }

        let connection = voice.getVoiceConnection(guild.id);
        if (!connection) {
            connection = voice.joinVoiceChannel({
                channelId: channel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
            });

            connection.on('stateChange', async (previous, current) => {
                if (current.status === voice.VoiceConnectionStatus.Disconnected) {
                    if (current.reason === voice.VoiceConnectionDisconnectReason.WebSocketClose && current.closeCode === 4014) {
                        try {
                            await voice.entersState(connection, voice.VoiceConnectionStatus.Connecting, 5000);
                        }
                        catch {
                            if (current.status !== voice.VoiceConnectionStatus.Destroyed) {
                                connection.destroy();
                            }
                        }
                    }
                    else if (connection.rejoinAttempts < 5) {
                        await MusicPlayer.wait((connection.rejoinAttempts + 1) * 5000);
                        connection.rejoin();
                    }
                    else {
                        connection.destroy();
                    }
                }
                else if (current.status === voice.VoiceConnectionStatus.Destroyed) {
                    if (queues[guild.id]) {
                        queues[guild.id] = [];
                    }
                }
                else if (!connection.readyLock && (current.status === voice.VoiceConnectionStatus.Connecting || current.status === voice.VoiceConnectionStatus.Signalling)) {
                    connection.readyLock = true;
                    try {
                        await voice.entersState(connection, voice.VoiceConnectionStatus.Ready, 20_000);
                    }
                    catch {
                        if (connection.state.status !== voice.VoiceConnectionStatus.Destroyed) { connection.destroy(); };
                    }
                    finally {
                        this.readyLock = false;
                    }
                }

            });
        }

        connection.subscribe(players[guild.id]);

        if (players[guild.id].state.status === "idle" && info.url) {
            MusicPlayer.playNext(guild, false);
        }

        if (position === 0 && info.url) {
            MusicPlayer.playNext(guild, false);
        }

        if (settings[guild.id] && settings[guild.id].loop) { settings[guild.id].loop = queues[guild.id]; }
        return queues[guild.id];
    }

    /**
     * @description Plays the next song in the specified guild's queue
     * @param {Guild} guild The guild to play the next song for
     * @param {Boolean} shift Whether to shift the queue
    */
    static async playNext(guild, shift = true) {
        let [next, info] = await MusicPlayer.shiftQueue(guild, shift);
        let { url, data } = info;

        if (!next || !info || !url || !data) { return; }
        if (!players[guild.id]) { return; }

        players[guild.id].play(next);
        let channel = await guild.channels.fetch(DataUtils.getConfig(guild).modules.entertainment.music['public-log-channel']);

        if (channel instanceof GuildChannel && PermissionUtils.botPermission(channel, PermissionUtils.PermissionGroups.MUSIC_PLAYER)) {
            let viewQueueButton = new MessageButton().setCustomId("25c565aa300c-42f2ccd6").setLabel("View Queue").setEmoji("<:Iris_Playlist:981984427733307422>").setStyle("PRIMARY");
            let likeButton = new MessageButton().setCustomId("25c565aa300c-80e0f1c2").setEmoji("<:Iris_ThumbUp:981983619306369114>").setStyle("SECONDARY");
            let dislikeButton = new MessageButton().setCustomId("25c565aa300c-a760b098").setEmoji("<:Iris_ThumbDown:981985473482350632>").setStyle("SECONDARY");

            let buttons = new MessageActionRow().addComponents(viewQueueButton, likeButton, dislikeButton);

            let nowPlaying = await MusicPlayerThumbnail.getNowPlaying(data.thumbnails[data.thumbnails.length - 1].url, data.title, data.author.name.endsWith(" - Topic") ? data.author.name.split(" - ")[0] : data.author.name, data.lengthSeconds);
            let attachment = new MessageAttachment(nowPlaying.toBuffer("image/png"), `${Buffer.from(url).toString("base64")}.png`);

            channel.send({
                files: [attachment],
                components: [buttons],
            });
        }
    }

    /**
         * @description Moves the queue forward
         * @param {Guild} guild The guild to shift the queue forward for
         * @param {Boolean} shift Whether to remove the first video in the queue
         * @returns {voice.AudioResource} The next video in the queue
        */
    static async shiftQueue(guild, shift = true) {
        if (shift) { queues[guild.id] = queues[guild.id].slice(1); }
        if (queues[guild.id].length === 0 && (settings[guild.id] && settings[guild.id].loop)) { queues[guild.id] = settings[guild.id].loop; }
        else if (queues[guild.id].length === 0) { return [[], {}]; }


        const stream = await playdl.stream(queues[guild.id][0].url);
        return [voice.createAudioResource(stream.stream, { inputType: stream.type }), queues[guild.id][0], stream];
    }

    /**
     * @description Toggles a guild's music queue loop mode
     * @param {Guild} guild The guild to begin or end looping for
     */
    static toggleLoop(guild) {
        if (!settings[guild.id]) { settings[guild.id] = {}; }
        if (settings[guild.id].loop) {
            settings[guild.id].loop = false;
        }
        else {
            settings[guild.id].loop = queues[guild.id] ? queues[guild.id] : false;
        }

        return settings[guild.id].loop;
    }

    /**
     * @description Retrieves the current queue for a server
     * @param {Guild} guild The server to get the queue for
     * @returs {Array<Object>} The queue and settings for the guild
    */
    static getQueue(guild) {
        return [queues[guild.id], settings[guild.id] || {}];
    }

}


module.exports = MusicPlayer;
