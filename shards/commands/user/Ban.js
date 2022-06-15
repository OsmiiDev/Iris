const {ContextMenuCommandBuilder} = require("@discordjs/builders");
const {Modal, MessageActionRow, TextInputComponent, GuildMember, User} = require("discord.js");

const DataUtils = require("../../utility/DataUtils");
const PermissionUtils = require("../../utility/PermissionUtils");

const ActionBan = require("../../modules/moderation/actions/ActionBan");

const UserCommand = require("../UserCommand");
const MessageUtils = require("../../utility/MessageUtils");

/**
 * @description Ban user command
*/
class Ban extends UserCommand {
    /**
     * @description Constructor
    */
    constructor() {
        super("Ban");
    }

    /**
     * @description Gets the command information
     * @return {Object} The command object
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
        if (!interaction.guild || !interaction.channel || !interaction.member || !interaction.targetId) {
            return;
        }
        if (!PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_BAN_CREATE")) {
            return;
        }
        if (!PermissionUtils.botPermission(interaction.guild, PermissionUtils.PermissionGroups.MODERATION_BASIC)) {
            return;
        }

        const user = await process.client.users.fetch(interaction.targetId).catch(() => { });
        if (!(user instanceof User)) {
            return interaction.reply({embeds: [this.getError()]});
        }
        if (user.bot || user.system) {
            return interaction.reply({embeds: [this.getError("I can't ban bots.")]});
        }

        const member = await interaction.guild.members.fetch(user.id).catch(() => { });

        if (member instanceof GuildMember && interaction.member.roles.highest.comparePositionTo(member.roles.highest) < 0 || member.id === member.guild.ownerId) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("You can't ban this user.")], ephemeral: true});
        }

        if (member instanceof GuildMember && !member.bannable) {
            return interaction.reply({embeds: [this.getError("I do not have permission to ban this user.")]});
        }

        const behavior = DataUtils.getConfig(interaction.guild).modules.moderation.actions.ban.behavior;

        const banModalTime = new MessageActionRow().addComponents(
            new TextInputComponent().setCustomId("c82e7044")
                .setLabel("Time")
                .setStyle("SHORT")
                .setPlaceholder(behavior === "matrix" ? DataUtils.parseTimeToString(ActionBan.getDefaultTime(interaction.guild, user.id)) : "Permanent")
                .setRequired(false)
        );

        const banModalReason = new MessageActionRow().addComponents(
            new TextInputComponent().setCustomId("ed41d388")
                .setLabel("Reason")
                .setStyle("PARAGRAPH")
                .setPlaceholder("Enter a reason here...")
                .setRequired(false)
        );

        const muteModal = new Modal().setCustomId(`1901a7398c72-${user.id}`).setTitle("Ban user").addComponents(banModalTime, banModalReason);

        interaction.showModal(muteModal).catch(() => { });
    }
}


module.exports = Ban;
