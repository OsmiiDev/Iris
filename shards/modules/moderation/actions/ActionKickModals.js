const {GuildMember} = require("discord.js");
const crypto = require("crypto");

const DataUtils = require("../../../utility/DataUtils");
const PermissionUtils = require("../../../utility/PermissionUtils");

const ActionCase = require("./ActionCase");
const ActionMatrix = require("./ActionMatrix");

const IrisModule = require("../../IrisModule");
const MessageUtils = require("../../../utility/MessageUtils");

/**
 * @description Handles modal submission for kicking members
*/
class ActionKickModals extends IrisModule {
    LISTENERS = [
        {event: "interactionCreate", function: this.createKickModal}
    ];

    /**
     * @description Constructor
    */
    constructor() {
        super("moderation.actions.ActionKickModals");

        this.registerEvents();
    }

    /**
     * @param {ModalSubmitInteraction} interaction The interaction object
    */
    async createKickModal(interaction) {
        if (!interaction.isModalSubmit() || !interaction.customId.startsWith("4232b9120f41")) {
            return;
        }
        if (!interaction.inGuild() || !(interaction.member instanceof GuildMember) || !PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_KICK_CREATE")) {
            return;
        }

        if (!interaction.guild.me.permissions.has("ADMINISTRATOR")) {
            return;
        }

        const userId = interaction.customId.split("-")[1];
        if (!userId) {
            return;
        }

        const member = await interaction.guild.members.fetch(userId).catch(() => {});
        if (!(member instanceof GuildMember)) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed()]});
        }
        if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) < 0 || member.id === interaction.guild.ownerId) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("I can't kick this user.")]});
        }

        const user = member.user;

        let reason = interaction.fields.getTextInputValue("1f5612b1");
        if (!reason || reason.length === 0) {
            reason = "No reason provided.";
        }

        if (DataUtils.getConfig(interaction.guild).modules.moderation.actions.kick["kick-message-public"]) {
            const message = JSON.stringify(DataUtils.getConfig(interaction.guild).modules.moderation.actions.kick["kick-message-public"])
                .replace(/\{UserTag\}/g, member.user.tag)
                .replace(/\{Reason\}/g, reason.escape());

            interaction.reply(JSON.parse(message));
        }

        if (DataUtils.getConfig(interaction.guild).modules.moderation.actions.kick["kick-message-private"]) {
            const message = JSON.stringify(DataUtils.getConfig(interaction.guild).modules.moderation.actions.kick["kick-message-private"])
                .replace(/\{GuildName\}/g, member.guild.name)
                .replace(/\{Reason\}/g, reason.escape());

            await member.user.send(JSON.parse(message)).catch(() => { });
        }

        ActionKickModals.createKick(member, reason);
        ActionCase.createCase(member.guild, "KICK_CREATE", `${member.id}:${crypto.randomUUID()}`, user, interaction.member, reason);
    }

    /**
     * @description Kicks a user from a server
     * @param {GuildMember} member The member to kick
     * @param {String} reason Why you are kicking this user
     * @param {String} matrix The punihsment matrix to use
     * @return {String} The ID of the kick
    */
    static createKick(member, reason, matrix) {
        const kickData = DataUtils.read(member.guild, "moderation/actions/kicks");
        if (!kickData[member.id]) {
            kickData[member.id] = [];
        }

        const id = `${member.id}:${crypto.randomUUID()}`;

        kickData[member.id].push({
            "id": id,
            "reason": reason,
            "start": Math.floor(new Date().getTime() / 1000),
            "expired": false,
            "matrix": matrix || DataUtils.getConfig(member.guild).modules.moderation.actions.kick.matrix
        });


        DataUtils.write(member.guild, "moderation/actions/kicks", kickData);

        member.kick(reason);

        ActionMatrix.handleMatrix(member.guild, matrix || DataUtils.getConfig(member.guild).modules.moderation.actions.kick.matrix, member.user, "kick");

        return id;
    }

    /**
     * @description Gets the kick history of a user
     * @param {GuildMember} member The member to get the kick history of
     * @return {Object} The kick history of the user
    */
    static getHistory(member) {
        const data = DataUtils.read(member.guild, "moderation/actions/kicks")[member.id];
        return data || [];
    }
}

module.exports = ActionKickModals;
