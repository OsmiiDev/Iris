const { ContextMenuCommandBuilder } = require("@discordjs/builders");
const { Interaction, Modal, MessageActionRow, TextInputComponent, MessageContextMenuInteraction, GuildMember, User, ApplicationCommand } = require("discord.js");

const DataUtils = require("../../utility/DataUtils");
const ModuleUtils = require("../../utility/ModuleUtils");
const PermissionUtils = require("../../utility/PermissionUtils");

const ActionBan = ModuleUtils.getModule("moderation.actions.ActionBan");

const UserCommand = require("../UserCommand");

class Ban extends UserCommand {

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
            .setType(2);
    }

    /**
     * @description Runs the command
     * @param {UserContextMenuInteraction} interaction The command interaction object
    */
    static async run(interaction) {
        if (!interaction.guild || !interaction.channel || !interaction.member || !interaction.targetId) { return; }
        if (!PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_BAN_CREATE")) { return; }
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MODERATION_BASIC)) { return; }

        let user = await process.client.users.fetch(interaction.targetId).catch(() => { });
        if (!(user instanceof User)) { return interaction.reply({ embeds: [this.getError()] }); }
        if (user.bot || user.system) { return interaction.reply({ embeds: [this.getError("I can't ban bots.")] }); }

        let member = await interaction.guild.members.fetch(user.id).catch(() => { });
        if (member instanceof GuildMember && !member.bannable) {
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
