const {GuildMember} = require("discord.js");

const DataUtils = require("../../../utility/DataUtils");
const MessageUtils = require("../../../utility/MessageUtils");
const PermissionUtils = require("../../../utility/PermissionUtils");

const ActionCase = require("./ActionCase");
const ActionMute = require("./ActionMute");

const IrisModule = require("../../IrisModule");

/**
 * @description Handles modal submissions for mutes
*/
class ActionMuteModals extends IrisModule {
    LISTENERS = [
        {event: "interactionCreate", function: this.createMuteModal},
        {event: "interactionCreate", function: this.deleteMuteModal}
    ];

    /**
     * @description Constructor
    */
    constructor() {
        super("moderation.actions.ActionMuteModals");

        this.registerEvents();
    }

    /**
     * @param {ModalSubmitInteraction} interaction The interaction object
    */
    async createMuteModal(interaction) {
        if (!interaction.isModalSubmit() || !interaction.customId.startsWith("1a1f42af587b")) {
            return;
        }
        if (!interaction.inGuild() || !(interaction.member instanceof GuildMember) || !PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_MUTE_CREATE")) {
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
        if (!member.manageable || !member.moderatable) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("I can't mute this user.")]});
        }

        if (DataUtils.getConfig(member.guild).modules.moderation.actions.mute.role) {
            const mutedRole = await member.guild.roles.fetch(DataUtils.getConfig(member.guild).modules.moderation.actions.mute.role);
            if (interaction.guild.me.roles.highest.comparePositionTo(mutedRole) <= 0) {
                return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("I can't mute this user.")]});
            }
        }

        const behavior = DataUtils.getConfig(member.guild).modules.moderation.actions.mute.behavior;

        let time = interaction.fields.getTextInputValue("ec6bc3ab");
        if (time && time.length > 0) {
            time = DataUtils.parseTime(time);
        } else if (behavior === "matrix") {
            time = time.toLowerCase().includes("permanent") ? 0 : ActionMute.getDefaultTime(member);
        } else if (behavior === "permanent") {
            time = 0;
        }

        let reason = interaction.fields.getTextInputValue("da80d6f2");
        if (!reason) {
            reason = "No reason provided.";
        }

        const muteId = await ActionMute.createMute(member, time, reason);

        if (DataUtils.getConfig(interaction.guild).modules.moderation.actions.mute["mute-message-public"]) {
            const message = JSON.stringify(DataUtils.getConfig(interaction.guild).modules.moderation.actions.mute["mute-message-public"])
                .replace(/\{UserTag\}/g, member.user.tag)
                .replace(/\{Reason\}/g, reason.escape());

            interaction.reply(JSON.parse(message));
        }

        if (DataUtils.getConfig(interaction.guild).modules.moderation.actions.mute["mute-message-private"]) {
            const message = JSON.stringify(DataUtils.getConfig(interaction.guild).modules.moderation.actions.mute["mute-message-private"])
                .replace(/\{GuildName\}/g, member.guild.name)
                .replace(/\{ForTime\}/g, time === 0 ? "" : `for ${DataUtils.parseTimeToString(time)}`)
                .replace(/\{Reason\}/g, reason.escape());

            member.user.send(JSON.parse(message)).catch(() => { });
        }

        ActionCase.createCase(member.guild, "MUTE_CREATE", muteId, member, interaction.member, reason, time);
    }

    /**
     * @param {ModalSubmitInteraction} interaction The interaction object
    */
    async deleteMuteModal(interaction) {
        if (!interaction.isModalSubmit() || !interaction.customId.startsWith("731bfb357a6f")) {
            return;
        }
        if (!interaction.inGuild() || !(interaction.member instanceof GuildMember) || !PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_MUTE_DELETE")) {
            return;
        }

        const botMember = interaction.guild.me;
        if (!(botMember instanceof GuildMember) || !botMember.permissions.has("ADMINISTRATOR")) {
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
        if (!member.manageable || !member.moderatable) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("I can't unmute this user.")]});
        }

        let muteId = "";
        if (ActionMute.hasActiveMute(member)) {
            ActionMute.getHistory(member).filter((value) => {
                return !value.expired;
            }).forEach((mute) => {
                muteId = mute.id;
                ActionMute.deleteMute(member.guild, mute.id);
            });
        }

        const role = DataUtils.getConfig(member.guild).modules.moderation.actions.mute.role;
        if (role && member.roles.cache.has(role)) {
            member.roles.remove(role);
        }

        if (member.isCommunicationDisabled()) {
            member.timeout(0);
        }

        let reason = interaction.fields.getTextInputValue("0a8b0bef");
        if (!reason) {
            reason = "No reason provided.";
        }

        if (DataUtils.getConfig(interaction.guild).modules.moderation.actions.mute["unmute-message-public"]) {
            const message = JSON.stringify(DataUtils.getConfig(interaction.guild).modules.moderation.actions.mute["unmute-message-public"])
                .replace(/\{UserTag\}/g, member.user.tag)
                .replace(/\{Reason\}/g, reason.escape());

            interaction.reply(JSON.parse(message));
        }

        if (DataUtils.getConfig(interaction.guild).modules.moderation.actions.mute["unmute-message-private"]) {
            const message = JSON.stringify(DataUtils.getConfig(interaction.guild).modules.moderation.actions.mute["unmute-message-private"])
                .replace(/\{GuildName\}/g, member.guild.name)
                .replace(/\{Reason\}/g, reason.escape());

            member.user.send(JSON.parse(decodeURIComponent(message))).catch(() => { });
        }

        ActionCase.createCase(member.guild, "MUTE_DELETE", muteId, member, interaction.member, reason);
    }
}

module.exports = ActionMuteModals;

