const { ContextMenuCommandBuilder } = require("@discordjs/builders");
const { Interaction, Modal, MessageActionRow, TextInputComponent, MessageContextMenuInteraction, Message } = require("discord.js");

const PermissionUtils = require("../../utility/PermissionUtils");

const MessageCommand = require("../MessageCommand");

class Unmute extends MessageCommand {

    constructor() {
        super("Unmute");
    }

    /**
     * @description Gets the command information
     * @returns The command object
    */
    static getBuilder() {
        return new ContextMenuCommandBuilder()
            .setName("Unmute")
            .setType(3);
    }

    /**
     * @description Runs the command
     * @param {MessageContextMenuInteraction} interaction The command interaction object
    */
    static async run(interaction) {
        if (!interaction.guild || !interaction.channel || !interaction.member || !interaction.targetId) { return; }
        if (!PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_MUTE_DELETE")) { return; }
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MODERATION_BASIC)) { return; }

        let message = await interaction.channel.messages.fetch(interaction.targetId).catch(() => { });
        if (!(message instanceof Message)) { return interaction.reply({ embeds: [this.getError()] }); }

        let member = message.member;
        if (!member) { return interaction.reply({ embeds: [this.getError()] }); }

        if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) < 0 || member.id === member.guild.ownerId) {
            return interaction.reply({ embeds: [MessageUtils.generateErrorEmbed("You can't unmute this user.")], ephemeral: true });
        }

        if (!member.moderatable) {
            return interaction.reply({ embeds: [this.getError("I do not have permission to unmute this user.")] });
        }

        let unmuteModalReason = new MessageActionRow().addComponents(
            new TextInputComponent().setCustomId("0a8b0bef")
                .setLabel("Reason")
                .setStyle("PARAGRAPH")
                .setPlaceholder("Enter a reason here...")
                .setRequired(false)
        );

        let unmuteModal = new Modal().setCustomId(`731bfb357a6f-${member.id}`).setTitle("Unmute user").addComponents(unmuteModalReason);

        interaction.showModal(unmuteModal).catch(() => { });;
    }

}

module.exports = Unmute;