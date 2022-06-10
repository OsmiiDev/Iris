const { GuildMember, User } = require("discord.js");

const DataUtils = require("../../../utility/DataUtils");
const MessageUtils = require("../../../utility/MessageUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");
const PermissionUtils = require("../../../utility/PermissionUtils");

const ActionBan = ModuleUtils.getModule("moderation.actions.ActionBan");
const ActionCase = ModuleUtils.getModule("moderation.actions.ActionCase");

const IrisModule = ModuleUtils.getModule("core.IrisModule");

class ActionBanModals extends IrisModule {

    LISTENERS = [
        { event: "interactionCreate", function: this.createBanModal }
    ];

    constructor() {
        super("moderation.actions.ActionBanModals");

        this.registerEvents();
    }

    /**
     * @param {ModalSubmitInteraction} interaction The interaction object
    */
    async createBanModal(interaction) {
        if (!interaction.isModalSubmit() || !interaction.customId.startsWith("1901a7398c72")) { return; }
        if (!interaction.inGuild() || !(interaction.member instanceof GuildMember) || !PermissionUtils.hasPermission(interaction.member, "MODERATION_ACTION_BAN_CREATE")) { return; }

        if (!interaction.guild.me.permissions.has("ADMINISTRATOR")) { return; }

        let userId = interaction.customId.split("-")[1];
        if (!userId) { return; }

        let user = await process.client.users.fetch(userId);
        if (!(user instanceof User)) { return interaction.reply({ embeds: [MessageUtils.generateErrorEmbed()] }); }

        let member = await interaction.guild.members.fetch(userId).catch(() => {});
        if (member instanceof GuildMember && (!member.manageable || !member.moderatable || !member.bannable)) {
            return interaction.reply({ embeds: [MessageUtils.generateErrorEmbed("I can't ban this user.")] });
        }

        let behavior = DataUtils.getConfig(interaction.guild).modules.moderation.actions.ban.behavior;

        let time = interaction.fields.getTextInputValue("c82e7044");
        if (time && time.length > 0) { time = DataUtils.parseTime(time); }
        else if (behavior === "matrix") { time = time.toLowerCase().includes("permanent") ? 0 : ActionBan.getDefaultTime(interaction.guild, user.id); }
        else if (behavior === "permanent") { time = 0; }

        let reason = interaction.fields.getTextInputValue("ed41d388");
        if (!reason) { reason = "No reason provided."; }

        let banId = await ActionBan.createBan(interaction.guild, user.id, time, reason);

        if (DataUtils.getConfig(interaction.guild).modules.moderation.actions.ban['ban-message-public']) {
            let message = JSON.stringify(DataUtils.getConfig(interaction.guild).modules.moderation.actions.ban['ban-message-public'])
                .replace(/\{UserTag\}/g, user ? user.tag : user.id)
                .replace(/\{Reason\}/g, reason.escape());

            interaction.reply(JSON.parse(message));
        }

        if (DataUtils.getConfig(interaction.guild).modules.moderation.actions.ban['ban-message-private']) {
            let message = JSON.stringify(DataUtils.getConfig(interaction.guild).modules.moderation.actions.ban['ban-message-private'])
                .replace(/\{GuildName\}/g, interaction.guild.name)
                .replace(/\{Reason\}/g, reason.escape());

            if (user) { user.send(JSON.parse(message)).catch(() => { }); }
        }

        ActionCase.createCase(interaction.guild, "BAN_CREATE", banId, user, interaction.member, reason, time);
    }

}

module.exports = ActionBanModals;