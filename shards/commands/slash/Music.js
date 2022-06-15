const {SlashCommandBuilder} = require("@discordjs/builders");

const PermissionUtils = require("../../utility/PermissionUtils");

const MusicPlayerCommands = require("../../modules/entertainment/music/MusicPlayerCommands");
const MusicPlayerPlaylists = require("../../modules/entertainment/music/MusicPlayerPlaylists");

const SlashCommand = require("../SlashCommand");

/**
 * @description Music commands
 */
class Music extends SlashCommand {
    /**
     * @description Constructor
    */
    constructor() {
        super("Music");
    }

    /**
     * @description Gets the command information
     * @return {Object} The command object
    */
    static getBuilder() {
        return new SlashCommandBuilder()
            .setName("music")
            .setDescription("Commands for the music player")
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("play")
                    .setDescription("Adds a track to the queue")
                    .addStringOption((option) => {
                        return option.setName("song").setDescription("The search term of the song to play, or a link to the song").setRequired(true);
                    })
                    .addStringOption((option) => {
                        return option.setName("queue").setDescription("Where to place the video in the queue").setChoices(
                            {"name": "Now", "value": "Now"},
                            {"name": "First", "value": "First"},
                            {"name": "Last", "value": "Last"}
                        ).setRequired(false);
                    })
            )

            .addSubcommand((subcommand) =>
                subcommand
                    .setName("queue")
                    .setDescription("View the music queue")
                    .addIntegerOption((option) => {
                        return option.setName("page").setDescription("Page number for the queue").setRequired(false);
                    })
            )

            .addSubcommand((subcommand) =>
                subcommand
                    .setName("skip")
                    .setDescription("Skips the current track and moves on to the next one")
            )

            .addSubcommand((subcommand) =>
                subcommand
                    .setName("loop")
                    .setDescription("Toggles whether to loop the current queue")
            )

            .addSubcommand((subcommand) =>
                subcommand
                    .setName("playlists")
                    .setDescription("Gets your playlists")
                    .addStringOption((option) => {
                        return option.setName("playlist").setDescription("The playlist to view").setRequired(false);
                    })
            );
    }

    /**
     * @description Runs the command
     * @param {CommandInteraction} interaction The command interaction object
    */
    static async run(interaction) {
        if (!interaction.guild || !interaction.channel || !interaction.member) {
            return;
        }
        if (!PermissionUtils.hasPermission(interaction.member, "MUSIC_PLAYER_USE")) {
            return;
        }
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MUSIC_PLAYER)) {
            return;
        }
        if (!interaction.options.getSubcommand()) {
            return;
        }

        if (interaction.options.getSubcommand() === "play") {
            if (!PermissionUtils.hasPermission(interaction.member, "MUSIC_PLAYER_PLAY")) {
                return;
            }
            MusicPlayerCommands.play(interaction, interaction.options.getString("song"), interaction.options.getString("queue"));
        }

        if (interaction.options.getSubcommand() === "skip") {
            if (!PermissionUtils.hasPermission(interaction.member, "MUSIC_PLAYER_SKIP")) {
                return;
            }
            MusicPlayerCommands.skip(interaction);
        }

        if (interaction.options.getSubcommand() === "leave") {
            // leave the voice channel and clear queue
        }

        if (interaction.options.getSubcommand() === "loop") {
            if (!PermissionUtils.hasPermission(interaction.member, "MUSIC_PLAYER_LOOP")) {
                return;
            }
            MusicPlayerCommands.loop(interaction);
        }

        if (interaction.options.getSubcommand() === "playlists") {
            MusicPlayerPlaylists.viewPlaylists(interaction);
        }

        if (interaction.options.getSubcommand() === "queue") {
            if (!PermissionUtils.hasPermission(interaction.member, "MUSIC_PLAYER_PLAY")) {
                return;
            }
            MusicPlayerCommands.viewQueue(interaction);
        }
    }
}

module.exports = Music;
