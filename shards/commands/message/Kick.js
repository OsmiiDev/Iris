const { ContextMenuCommandBuilder } = require("@discordjs/builders");
const { Interaction, Modal, MessageActionRow, TextInputComponent, MessageContextMenuInteraction, Message, GuildMember } = require("discord.js");

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
            .setType(3);
    }

    /**
     * @description Runs the command
     * @param {MessageContextMenuInteraction} interaction The command interaction object
    */
    static async run(interaction) {
        if (!interaction.guild || !interaction.channel || !interaction.member || !interaction.targetId) { return; }
        if (!PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_KICK_CREATE")) { return; }
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MODERATION_BASIC)) { return; }

        let message = await interaction.channel.messages.fetch(interaction.targetId).catch(() => { });
        if (!(message instanceof Message)) { return interaction.reply({ embeds: [this.getError()] }); }

        let member = message.member;
        if (!(member instanceof GuildMember)) { return interaction.reply({ embeds: [this.getError()] }); }
        if (member.user.bot || member.user.system) { return interaction.reply({ embeds: [this.getError("I can't kick bots.")] }); }

        if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) < 0 || member.id === member.guild.ownerId) {
            return interaction.reply({ embeds: [MessageUtils.generateErrorEmbed("You can't kick this user.")], ephemeral: true });
        }

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