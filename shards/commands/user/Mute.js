const {ContextMenuCommandBuilder} = require("@discordjs/builders");
const {Modal, MessageActionRow, TextInputComponent} = require("discord.js");

const DataUtils = require("../../utility/DataUtils");
const PermissionUtils = require("../../utility/PermissionUtils");

const ActionMute = require("../../modules/moderation/actions/ActionMute");

const UserCommand = require("../UserCommand");
const MessageUtils = require("../../utility/MessageUtils");

/**
 * @description Mute user command
*/
class Mute extends UserCommand {
    /**
     * @description Constructor
    */
    constructor() {
        super("Mute");
    }

    /**
     * @description Gets the command information
     * @return {Object} The command object
    */
    static getBuilder() {
        return new ContextMenuCommandBuilder()
            .setName("Mute")
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
        if (!PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_MUTE_CREATE")) {
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
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("You can't mute this user.")], ephemeral: true});
        }

        if (!member.moderatable) {
            return interaction.reply({embeds: [this.getError("I do not have permission to mute this user.")]});
        }

        const behavior = DataUtils.getConfig(member.guild).modules.moderation.actions.mute.behavior;

        const muteModalTime = new MessageActionRow().addComponents(
            new TextInputComponent().setCustomId("ec6bc3ab")
                .setLabel("Time")
                .setStyle("SHORT")
                .setPlaceholder(behavior === "matrix" ? DataUtils.parseTimeToString(ActionMute.getDefaultTime(member)) : "Permanent")
                .setRequired(false)
        );

        const muteModalReason = new MessageActionRow().addComponents(
            new TextInputComponent().setCustomId("da80d6f2")
                .setLabel("Reason")
                .setStyle("PARAGRAPH")
                .setPlaceholder("Enter a reason here...")
                .setRequired(false)
        );

        const muteModal = new Modal().setCustomId(`1a1f42af587b-${member.id}`).setTitle("Mute user").addComponents(muteModalTime, muteModalReason);

        interaction.showModal(muteModal).catch(() => { });
    }
}

module.exports = Mute;
