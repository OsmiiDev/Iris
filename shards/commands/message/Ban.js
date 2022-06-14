const { ContextMenuCommandBuilder } = require("@discordjs/builders");
const { Interaction, Modal, MessageActionRow, TextInputComponent, MessageContextMenuInteraction, GuildMember, User, Message } = require("discord.js");

const DataUtils = require("../../utility/DataUtils");
const ModuleUtils = require("../../utility/ModuleUtils");
const PermissionUtils = require("../../utility/PermissionUtils");

const MessageCommand = require("../MessageCommand");

const ActionBan = require("../../modules/moderation/actions/ActionBan");

class Ban extends MessageCommand {

    constructor() {
        super("Ban");
    }

    /**
     * @description Gets the command information
     * @returns The command object
    */
    static getBuilder() {
        return new ContextMenuCommandBuilder()
            .setName("Ban")
            .setType(3);
    }

    /**
     * @description Handles the command running
     * @param {MessageContextMenuInteraction} interaction The command interaction object
    */
    static async run(interaction) {
        if (!interaction.guild || !interaction.channel || !interaction.member || !interaction.targetId) { return; }
        if (!PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_BAN_CREATE")) { return; }
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MODERATION_BASIC)) { return; }

        let message = await interaction.channel.messages.fetch(interaction.targetId).catch(() => { });
        if (!(message instanceof Message)) { return interaction.reply({ embeds: [this.getError()] }); }
        
        let user = message.author;
        if (!(user instanceof User)) { return interaction.reply({ embeds: [this.getError()] }); }
        if (user.bot || user.system) { return interaction.reply({ embeds: [this.getError("I can't ban bots.")] }); }

        if (message.member instanceof GuildMember && interaction.member.roles.highest.comparePositionTo(member.roles.highest) < 0 || member.id === member.guild.ownerId) {
            return interaction.reply({ embeds: [MessageUtils.generateErrorEmbed("You can't ban this user.")], ephemeral: true });
        }

        if (message.member instanceof GuildMember && !message.member.bannable) {
            return interaction.reply({ embeds: [this.getError("I do not have permission to ban this user.")] });
        }

        let behavior = DataUtils.getConfig(interaction.guild).modules.moderation.actions.ban.behavior;

        let banModalTime = new MessageActionRow().addComponents(
            new TextInputComponent().setCustomId("c82e7044")
                .setLabel("Time")
                .setStyle("SHORT")
                .setPlaceholder(behavior === "matrix" ? DataUtils.parseTimeToString(ActionBan.getDefaultTime(interaction.guild, user.id)) : "Permanent")
                .setRequired(false)
        );

        let banModalReason = new MessageActionRow().addComponents(
            new TextInputComponent().setCustomId("ed41d388")
                .setLabel("Reason")
                .setStyle("PARAGRAPH")
                .setPlaceholder("Enter a reason here...")
                .setRequired(false)
        );

        let muteModal = new Modal().setCustomId(`1901a7398c72-${user.id}`).setTitle("Ban user").addComponents(banModalTime, banModalReason);

        interaction.showModal(muteModal).catch(() => { });
    }

}


module.exports = Ban;
