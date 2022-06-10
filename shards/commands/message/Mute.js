const { ContextMenuCommandBuilder } = require("@discordjs/builders");
const { Interaction, Modal, MessageActionRow, TextInputComponent, MessageContextMenuInteraction, Message } = require("discord.js");

const DataUtils = require("../../utility/DataUtils");
const ModuleUtils = require("../../utility/ModuleUtils");
const PermissionUtils = require("../../utility/PermissionUtils");

const ActionMute = ModuleUtils.getModule("moderation.actions.ActionMute");

const MessageCommand = require("../MessageCommand");

class Mute extends MessageCommand {

    constructor() {
        super("Mute");
    }

    /**
     * @description Gets the command information
     * @returns The command object
    */
    static getBuilder() {
        return new ContextMenuCommandBuilder()
            .setName("Mute")
            .setType(3);
    }

    /**
     * @description Runs the command
     * @param {MessageContextMenuInteraction} interaction The command interaction object
    */
    static async run(interaction) {
        if (!interaction.guild || !interaction.channel || !interaction.member || !interaction.targetId) { return; }
        if (!PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_MUTE_CREATE")) { return; }
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MODERATION_BASIC)) { return; }

        let message = await interaction.channel.messages.fetch(interaction.targetId).catch(() => { });
        if (!(message instanceof Message)) { return interaction.reply({ embeds: [this.getError()] }); }
        
        let member = message.member;
        if (!member) { return interaction.reply({ embeds: [this.getError()] }); }
        if (member.user.bot || member.user.system) { return interaction.reply({ embeds: [this.getError("I can't mute bots.")] }); }

        if (!member.moderatable) {
            return interaction.reply({ embeds: [this.getError("I do not have permission to mute this user.")] });
        }

        let behavior = DataUtils.getConfig(member.guild).modules.moderation.actions.mute.behavior;

        let muteModalTime = new MessageActionRow().addComponents(
            new TextInputComponent().setCustomId("ec6bc3ab")
                .setLabel("Time")
                .setStyle("SHORT")
                .setPlaceholder(behavior === "matrix" ? DataUtils.parseTimeToString(ActionMute.getDefaultTime(member)) : "Permanent")
                .setRequired(false)
        );

        let muteModalReason = new MessageActionRow().addComponents(
            new TextInputComponent().setCustomId("da80d6f2")
                .setLabel("Reason")
                .setStyle("PARAGRAPH")
                .setPlaceholder("Enter a reason here...")
                .setRequired(false)
        );

        let muteModal = new Modal().setCustomId(`1a1f42af587b-${member.id}`).setTitle("Mute user").addComponents(muteModalTime, muteModalReason);

        interaction.showModal(muteModal).catch(() => { });;
    }

}

module.exports = Mute;