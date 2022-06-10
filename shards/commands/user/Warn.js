const { ContextMenuCommandBuilder } = require("@discordjs/builders");
const { Interaction, Modal, MessageActionRow, TextInputComponent, MessageContextMenuInteraction, UserContextMenuInteraction } = require("discord.js");

const MessageUtils = require("../../utility/MessageUtils");
const PermissionUtils = require("../../utility/PermissionUtils");

const MessageCommand = require("../MessageCommand");

class Warn extends MessageCommand {

    constructor() {
        super("Warn");
    }

    /**
     * @description Gets the command information
     * @returns The command object
    */
    static getBuilder() {
        return new ContextMenuCommandBuilder()
            .setName("Warn")
            .setType(2);
    }

    /**
     * @description Runs the command
     * @param {UserContextMenuInteraction} interaction The command interaction object
    */
    static async run(interaction) {
        if (!interaction.guild || !interaction.channel || !interaction.member || !interaction.targetId) { return; }
        if (!PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_WARN_CREATE")) { return; }
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MODERATION_BASIC)) { return; }

        let member = await interaction.guild.members.fetch(interaction.targetId).catch(() => { });
        if (!member) { return interaction.reply({ embeds: [this.getError()] }); }
        if (member.user.bot || member.user.system) { return interaction.reply({ embeds: [this.getError("I can't warn bots.")] }); }

        if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) < 0 || member.id === member.guild.ownerId) {
            return interaction.reply({ embeds: [MessageUtils.generateErrorEmbed("You can't warn this user.")] });
        }

        if (!member.manageable) {
            return interaction.reply({ embeds: [MessageUtils.generateErrorEmbed("I can't warn this user.")] });
        }

        let warnModalReason = new MessageActionRow().addComponents(
            new TextInputComponent().setCustomId("e399ab77")
                .setLabel("Reason")
                .setStyle("PARAGRAPH")
                .setPlaceholder("Enter a reason here...")
                .setRequired(false)
        );

        let warnModal = new Modal().setCustomId(`afb656de113e-${member.id}`).setTitle("Warn user").addComponents(warnModalReason);

        interaction.showModal(warnModal).catch(() => { });
    }

}

module.exports = Warn;