const {GuildMember} = require("discord.js");
const crypto = require("crypto");

const DataUtils = require("../../../utility/DataUtils");
const PermissionUtils = require("../../../utility/PermissionUtils");

const ActionCase = require("./ActionCase");
const ActionMatrix = require("./ActionMatrix");

const IrisModule = require("../../IrisModule");
const MessageUtils = require("../../../utility/MessageUtils");

/**
 * @description Handles modal submissions for warnings and warns
*/
class ActionWarnModals extends IrisModule {
    LISTENERS = [
        {event: "interactionCreate", function: this.createWarnModal}
    ];

    /**
     * @description Constructor
    */
    constructor() {
        super("moderation.actions.ActionWarnModals");

        this.registerEvents();
    }

    /**
     * @param {ModalSubmitInteraction} interaction The interaction object
    */
    async createWarnModal(interaction) {
        if (!interaction.isModalSubmit() || !interaction.customId.startsWith("afb656de113e")) {
            return;
        }
        if (!interaction.inGuild() || !(interaction.member instanceof GuildMember) || !PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_WARN_CREATE")) {
            return;
        }

        if (!interaction.guild.me.permissions.has("ADMINISTRATOR")) {
            return;
        }

        const userId = interaction.customId.split("-")[1];
        if (!userId) {
            return;
        }

        const member = await interaction.guild.members.fetch(userId).catch(() => { });
        if (!(member instanceof GuildMember)) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed()]});
        }
        if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) < 0 || member.id === member.guild.ownerId) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("You can't warn this user.")]});
        }

        let reason = interaction.fields.getTextInputValue("e399ab77");
        if (!reason || reason.length === 0) {
            reason = "No reason provided.";
        }

        if (DataUtils.getConfig(interaction.guild).modules.moderation.actions.warn["warn-message-public"]) {
            const message = JSON.stringify(DataUtils.getConfig(interaction.guild).modules.moderation.actions.warn["warn-message-public"])
                .replace(/\{UserTag\}/g, member.user.tag)
                .replace(/\{Reason\}/g, reason.escape());

            interaction.reply(JSON.parse(message));
        }

        if (DataUtils.getConfig(interaction.guild).modules.moderation.actions.warn["warn-message-private"]) {
            const message = JSON.stringify(DataUtils.getConfig(interaction.guild).modules.moderation.actions.warn["warn-message-private"])
                .replace(/\{GuildName\}/g, member.guild.name)
                .replace(/\{Reason\}/g, reason.escape());

            member.user.send(JSON.parse(message)).catch(() => { });
        }

        ActionWarnModals.createWarn(member, reason);
        ActionCase.createCase(member.guild, "WARN_CREATE", `${member.id}:${crypto.randomUUID()}`, member, interaction.member, reason);
    }

    /**
     * @description Issues a warning to a specified user
     * @param {GuildMember} member The member to warn
     * @param {String} reason Why you are warning this user
     * @param {String} matrix The matrix to use
     * @return {String} The ID of the warning
    */
    static createWarn(member, reason, matrix) {
        const warnData = DataUtils.read(member.guild, "moderation/actions/warns");
        if (!warnData[member.id]) {
            warnData[member.id] = [];
        }

        const id = `${member.id}:${crypto.randomUUID()}`;

        warnData[member.id].push({
            "id": id,
            "reason": reason,
            "start": Math.floor(new Date().getTime() / 1000),
            "expired": false,
            "matrix": matrix || DataUtils.getConfig(member.guild).modules.moderation.actions.warn.matrix
        });

        DataUtils.write(member.guild, "moderation/actions/warns", warnData);

        ActionMatrix.handleMatrix(member.guild, matrix || DataUtils.getConfig(member.guild).modules.moderation.actions.warn.matrix, member.user, "warn");

        return id;
    }

    /**
     * @description Issues a warning, created by automod to a specified user
     * @param {GuildMember} member The member to warn
     * @param {String} reason Why you are warning this user
     * @param {String} matrix The matrix to use
     * @return {String} The ID of the warning
    */
    static createAutomodWarn(member, reason, matrix) {
        const autowarnData = DataUtils.read(member.guild, "moderation/actions/autowarns");
        if (!autowarnData[member.id]) {
            autowarnData[member.id] = [];
        }

        const id = `${member.id}:${crypto.randomUUID()}`;

        autowarnData[member.id].push({
            "id": id,
            "reason": reason,
            "start": Math.floor(new Date().getTime() / 1000),
            "expired": false,
            "matrix": matrix || DataUtils.getConfig(member.guild).modules.moderation.actions.warn.matrix
        });

        DataUtils.write(member.guild, "moderation/actions/autowarns", autowarnData);

        ActionMatrix.handleMatrix(member.guild, matrix || DataUtils.getConfig(member.guild).modules.moderation.actions.warn.matrix, member.user, "autowarn");

        return id;
    }

    /**
     * @description Gets the warning history of a user
     * @param {GuildMember} member The member ot get the warning history of
     * @return {Object} The warning history of the user
    */
    static getHistory(member) {
        const data = DataUtils.read(member.guild, "moderation/actions/warns")[member.id];
        return data || [];
    }
}

module.exports = ActionWarnModals;
