const { ContextMenuCommandBuilder } = require("@discordjs/builders");
const { Interaction, Modal, MessageActionRow, TextInputComponent, MessageContextMenuInteraction, UserContextMenuInteraction, GuildMember } = require("discord.js");

const PermissionUtils = require("../../utility/PermissionUtils");

const MessageCommand = require("../MessageCommand");

class Kick extends MessageCommand {

    constructor() {
        super("Kick");
    }

    /**
     * @description Gets the command information
     * @returns The command object
    */
    static getBuilder() {
        return new ContextMenuCommandBuilder()
            .setName("Kick")
            .setType(2);
    }

    /**
     * @description Runs the command
     * @param {UserContextMenuInteraction} interaction The command interaction object
    */
    static async run(interaction) {
        if (!interaction.guild || !interaction.channel || !interaction.member || !interaction.targetId) { return; }
        if (!PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_KICK_CREATE")) { return; }
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MODERATION_BASIC)) { return; }

        let member = await interaction.guild.members.fetch(interaction.targetId).catch(() => { });
        if (!(member instanceof GuildMember)) { return interaction.reply({ embeds: [this.getError()] }); }
        if (member.user.bot || member.user.system) { return interaction.reply({ embeds: [this.getError("I can't kick bots.")] }); }

        if (!member.kickable) {
            return interaction.reply({ embeds: [MessageUtils.generateErrorEmbed("I can't kick this user.")] });
        }

        let kickModalReason = new MessageActionRow().addComponents(
            new TextInputComponent().setCustomId("1f5612b1")
                .setLabel("Reason")
                .setStyle("PARAGRAPH")
                .setPlaceholder("Enter a reason here...")
                .setRequired(false)
        );

        let kickModal = new Modal().setCustomId(`4232b9120f41-${member.id}`).setTitle("Kick user").addComponents(kickModalReason);

        interaction.showModal(kickModal).catch(() => { });
    }

}

module.exports = Kick;