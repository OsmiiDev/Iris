const { ContextMenuCommandBuilder } = require("@discordjs/builders");
const { Interaction, Modal, MessageActionRow, TextInputComponent, MessageContextMenuInteraction } = require("discord.js");

const DataUtils = require("../../utility/DataUtils");
const ModuleUtils = require("../../utility/ModuleUtils");
const PermissionUtils = require("../../utility/PermissionUtils");

const ActionMute = ModuleUtils.getModule("moderation.actions.ActionMute");

const UserCommand = require("../UserCommand");

class Mute extends UserCommand {

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
            .setType(2);
    }

    /**
     * @description Runs the command
     * @param {UserContextMenuInteraction} interaction The command interaction object
    */
    static async run(interaction) {
        if (!interaction.guild || !interaction.channel || !interaction.member || !interaction.targetId) { return; }
        if (!PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_MUTE_CREATE")) { return; }
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MODERATION_BASIC)) { return; }

        let member = await interaction.guild.members.fetch(interaction.targetId).catch(() => { });
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

        interaction.showModal(muteModal).catch(() => { });
    }

}

module.exports = Mute;