const { ModalSubmitInteraction, GuildMember } = require("discord.js");
const crypto = require("crypto");

const DataUtils = require("../../../utility/DataUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");
const PermissionUtils = require("../../../utility/PermissionUtils");

const ActionCase = ModuleUtils.getModule("moderation.actions.ActionCase");
const ActionMatrix = ModuleUtils.getModule("moderation.actions.ActionMatrix");

const IrisModule = ModuleUtils.getModule("core.IrisModule");

class ActionKickModals extends IrisModule {

    LISTENERS = [
        { event: "interactionCreate", function: this.createKickModal }
    ];

    constructor() {
        super("moderation.actions.ActionKickModals");

        this.registerEvents();
    }

    /**
     * @param {ModalSubmitInteraction} interaction The interaction object
    */
    async createKickModal(interaction) {
        if (!interaction.isModalSubmit() || !interaction.customId.startsWith("4232b9120f41")) { return; }
        if (!interaction.inGuild() || !(interaction.member instanceof GuildMember) || !PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_KICK_CREATE")) { return; }

        if (!interaction.guild.me.permissions.has("ADMINISTRATOR")) { return; }

        let userId = interaction.customId.split("-")[1];
        if (!userId) { return; }

        let member = await interaction.guild.members.fetch(userId).catch(() => {});
        if (!member instanceof GuildMember) { return interaction.reply({ embeds: [MessageUtils.generateErrorEmbed()] }); }
        if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) < 0 || member.id === interaction.guild.ownerId) { return interaction.reply({ embeds: [MessageUtils.generateErrorEmbed("I can't kick this user.")] }); }

        let user = member.user;

        let reason = interaction.fields.getTextInputValue("1f5612b1");
        if (!reason || reason.length === 0) { reason = "No reason provided."; }

        if (DataUtils.getConfig(interaction.guild).modules.moderation.actions.kick['kick-message-public']) {
            let message = JSON.stringify(DataUtils.getConfig(interaction.guild).modules.moderation.actions.kick['kick-message-public'])
                .replace(/\{UserTag\}/g, member.user.tag)
                .replace(/\{Reason\}/g, reason.escape());

            interaction.reply(JSON.parse(message));
        }

        if (DataUtils.getConfig(interaction.guild).modules.moderation.actions.kick['kick-message-private']) {
            let message = JSON.stringify(DataUtils.getConfig(interaction.guild).modules.moderation.actions.kick['kick-message-private'])
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
     * @returns {String} The ID of the kick
    */
    static createKick(member, reason) {
        let kickData = DataUtils.read(member.guild, "moderation/actions/kicks");
        if (!kickData[member.id]) { kickData[member.id] = []; }

        let id = `${member.id}:${crypto.randomUUID()}`;

        kickData[member.id].push({
            "id": id,
            "reason": reason,
            "start": Math.floor(new Date().getTime() / 1000),
            "expired": false
        });


        DataUtils.write(member.guild, "moderation/actions/kicks", kickData);

        member.kick(reason);

        ActionMatrix.handleMatrix(member.guild, DataUtils.getConfig(member.guild).modules.moderation.actions.kick.matrix, member.user, "kick");

        return id;
    }

    /**
     * @description Gets the kick history of a user
     * @param {GuildMember} member The member to get the kick history of
     * @returns {Object} The kick history of the user
    */
    static getHistory(member) {
        let data = DataUtils.read(member.guild, "moderation/actions/kicks")[member.id];
        return data || [];
    }

}

module.exports = ActionKickModals;