const {MessageActionRow, MessageSelectMenu, MessageButton} = require("discord.js");

const DataUtils = require("../../../utility/DataUtils");
const MessageUtils = require("../../../utility/MessageUtils");
const PermissionUtils = require("../../../utility/PermissionUtils");

const IrisModule = require("../../IrisModule");

/**
 * @description Handles music player playlists
*/
class MusicPlayerPlaylists extends IrisModule {
    LISTENERS = [
        {event: "interactionCreate", function: this.selectPlaylist}
    ];

    /**
     * @description Constructor
    */
    constructor() {
        super("entertainment.music.MusicPlayerPlaylists");
        this.registerEvents();
    }

    /**
     * @description Gets the playlists for a user
     * @param {GuildMember|User|String} user The user to get the playlists for
     * @return {Object} The playlists for the user
    */
    static getPlaylists(user) {
        console.log(DataUtils.readUser(user.id || user, "entertainment/music/playlists"));
        return DataUtils.readUser(user.id || user, "entertainment/music/playlists").playlists;
    }

    /**
     * @description Views a user's playlists
     * @param {CommandInteraction} interaction The command interaction
    */
    static async viewPlaylists(interaction) {
        const playlists = MusicPlayerPlaylists.getPlaylists(interaction.user);

        const embed = MessageUtils.generateEmbed("Playlists",
            playlists ? `You have ${playlists.length} playlist${playlists.length === 1 ? "" : "s"}. Select one to modify it. 
        \n\n*Playlists are still in beta and you may experience some bugs. You can submit reports and feedback at https://github.com/OsmiiDev/Iris/issues.*` :
                "You have no playlists. Use the Create Playlist button below to get started.", "#4466DD", interaction.user).setFooter({text: "Iris Music"}).setTimestamp();

        const components = [];

        if (playlists) {
            const playlistMenu = new MessageSelectMenu().setCustomId(`723f421f55f0-${interaction.member.id}`)
                .setPlaceholder("Select a playlist");

            const playlistSelector = new MessageActionRow().addComponents(playlistMenu);

            playlists.sort().forEach((playlist, index) => {
                playlistMenu.addOptions({label: playlist.name, value: `${index}-${playlist.id}`});
            });

            components.push(playlistSelector);
        }

        const playlistCreateButton = new MessageButton()
            .setCustomId("c2a1b596")
            .setLabel("Create Playlist")
            .setEmoji("<:Iris_Plus:982483483630903296>")
            .setStyle("PRIMARY");

        components.push(new MessageActionRow().addComponents(playlistCreateButton));

        interaction.reply({embeds: [embed], components: components});
    }

    /**
     * @description Selects a playlist for the user
     * @param {SelectMenuInteraction} interaction The menu interaction
    */
    async selectPlaylist(interaction) {
        if (!interaction.isSelectMenu() || !interaction.customId.startsWith("723f421f55f0-")) {
            return;
        }
        if (!interaction.guild || !interaction.member || !PermissionUtils.hasPermission(interaction.member, "MUSIC_PLAYER_PLAYLISTS")) {
            return;
        }
        if (!interaction.guild.me.permissions.has("ADMINISTRATOR")) {
            return;
        }

        if (interaction.member.id !== interaction.customId.split("-")[1]) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("You can't do that.")], ephemeral: true});
        }
        if (!interaction.values || !interaction.values[0]) {
            return;
        }

        console.log(interaction.values[0].split("-")[0]);
        const data = MusicPlayerPlaylists.getPlaylists(interaction.user)[interaction.values[0].split("-")[0] * 1];
        if (!data) {
            return;
        }

        const embed = MessageUtils.generateEmbed(`Playlist: ${data.name}`, data.description, "#4466DD", interaction.user).setFooter({text: "Iris Music"}).setTimestamp();

        embed.addField("Created by", data.creator, true);
        embed.addField("Created at", `<t:${data.created}:f>`, true);
        embed.addField("Last modified", `<t:${data.modified}:f>`, true);

        let tracks = "";
        data.tracks.sort().forEach((track, index) => {
            tracks += `**\`${track.starred ? "⭐" : ""}${index + 1}\`** ${track.name} by ${track.author}\n`;
        });
        embed.addField("Tracks", tracks, false);

        embed.addField("\u200B", "*To select a specific track, use the dropdown below. To go back, select the `Back` button.*", false);

        console.log(interaction.values);
        interaction.update({embeds: [embed]}).catch(() => { });
    }
}

module.exports = MusicPlayerPlaylists;
