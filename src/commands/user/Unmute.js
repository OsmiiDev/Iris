const {ContextMenuCommandBuilder} = require("@discordjs/builders");
const {Modal, MessageActionRow, TextInputComponent} = require("discord.js");
const MessageUtils = require("../../utility/MessageUtils");

const PermissionUtils = require("../../utility/PermissionUtils");

const UserCommand = require("../UserCommand");

/**
 * @description Unmute user command
*/
class Unmute extends UserCommand {
    /**
     * @description Constructor
    */
    constructor() {
        super("Unmute");
    }

    /**
     * @description Gets the command information
     * @return {Object} The command object
    */
    static getBuilder() {
        return new ContextMenuCommandBuilder()
            .setName("Unmute")
            .setType(2);
    }

    /**
     * @description Runs the command
     * @param {UserContextMenuInteraction} interaction The command interaction object
    */
    static async run(interaction) {
        if (!interaction.guild || !interaction.channel || !interaction.member || !interaction.targetId) {
            return;
        }
        if (!PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_MUTE_DELETE")) {
            return;
        }
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MODERATION_BASIC)) {
            return;
        }

        const member = await interaction.guild.members.fetch(interaction.targetId).catch(() => { });
        if (!member) {
            return interaction.reply({embeds: [this.getError()]});
        }
        if (member.user.bot || member.user.system) {
            return interaction.reply({embeds: [this.getError("I can't mute bots.")]});
        }

        if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) < 0 || member.id === member.guild.ownerId) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("You can't unmute this user.")], ephemeral: true});
        }

        if (!member.manageable || !member.moderatable) {
            return interaction.reply({embeds: [this.getError("I do not have permission to mute this user.")]});
        }

        const unmuteModalReason = new MessageActionRow().addComponents(
            new TextInputComponent().setCustomId("0a8b0bef")
                .setLabel("Reason")
                .setStyle("PARAGRAPH")
                .setPlaceholder("Enter a reason here...")
                .setRequired(false)
        );

        const unmuteModal = new Modal().setCustomId(`731bfb357a6f-${member.id}`).setTitle("Unmute user").addComponents(unmuteModalReason);

        interaction.showModal(unmuteModal).catch(() => { });
    }
}

module.exports = Unmute;
