const {MessageButton, MessageActionRow, TextChannel, Modal, TextInputComponent} = require("discord.js");
const DataUtils = require("../../../utility/DataUtils");
const MessageUtils = require("../../../utility/MessageUtils");
const PermissionUtils = require("../../../utility/PermissionUtils");
const IrisModule = require("../../IrisModule");
const ModmailTicketManager = require("../../moderation/modmail/ModmailTicketManager");

const pendingApplications = {};

/**
 * @description Handles buttons for verification applications (accept, reject, question)
*/
class VerificationButtons extends IrisModule {
    LISTENERS = [
        {event: "interactionCreate", function: this.acceptButton},
        {event: "interactionCreate", function: this.acceptAdultButton},
        {event: "interactionCreate", function: this.rejectButton},
        {event: "interactionCreate", function: this.questionButton},
        {event: "interactionCreate", function: this.rejectModal}

    ];

    /**
     * @description Constructor
        {event: "interactionCreate", function: this.rejectButton},
        {event: "interactionCreate", function: this.questionButton}
    */
    constructor() {
        super("security.verification.VerificationButtons");

        this.registerEvents();
    }

    /**
     * @description Handles accepting applications
     * @param {ButtonInteraction} interaction The interaction
    */
    async acceptButton(interaction) {
        if (!interaction.inGuild() || !interaction.isButton() || !interaction.channel || !interaction.customId.startsWith("d2ca69928f59-c37c80de")) return;
        if (!interaction.member || !PermissionUtils.hasPermission(interaction.member, "VERIFICATION_PROCESS")) return;

        const guild = interaction.guild;
        const user = interaction.customId.split("-")[2] || "";

        const member = await guild.members.fetch(user).catch(() => {});
        if (!member || !member.manageable) return;
        DataUtils.getConfig(guild).modules.security.verification.roles.forEach(async (role) => {
            role = await guild.roles.fetch(role).catch(() => {});
            if (!role) return;

            if (guild.me.roles.highest.comparePositionTo(role) <= 0) return;

            await member.roles.add(role).catch(() => {});
        });


        const channel = await guild.channels.fetch(DataUtils.getConfig(guild).modules.security.verification["welcome-channel"]).catch(() => {});
        if (channel instanceof TextChannel) {
            channel.send(DataUtils.getConfig(guild).modules.security.verification["welcome-message"]
                .replace("{User}", member.user.id));
        }

        const applicationAcceptButton = new MessageButton()
            .setCustomId("x-c37c80de")
            .setLabel("Accept")
            .setEmoji("<:Iris_Confirm:973076220516388874>")
            .setStyle("SUCCESS")
            .setDisabled(true);

        const applicationAcceptAdultButton = new MessageButton()
            .setCustomId("x-627b2621")
            .setLabel("Accept as adult")
            .setStyle("SUCCESS")
            .setDisabled(true);

        const applicationRejectButton = new MessageButton()
            .setCustomId("x-1d81a28b")
            .setLabel("Reject")
            .setEmoji("<:Iris_Cancel:973076029654585364>")
            .setStyle("DANGER")
            .setDisabled(true);

        const applicationQuestionButton = new MessageButton()
            .setCustomId("x-f2faaa0d")
            .setLabel("Question")
            .setEmoji("<:Iris_Conversation:973459495139311687>")
            .setStyle("SECONDARY")
            .setDisabled(true);

        const applicationButtons = new MessageActionRow().addComponents(applicationAcceptButton, applicationAcceptAdultButton, applicationRejectButton, applicationQuestionButton);

        const embed = interaction.message.embeds ? interaction.message.embeds[0] : null;
        if (!embed) return;

        embed.setDescription(`**Accepted** by <@${interaction.member.id}>`);
        embed.setColor("#44DD66");

        interaction.update({components: [applicationButtons], embeds: [embed]}).catch(() => {});

        if (DataUtils.getConfig(guild).modules.security.verification["welcome-dm"]) {
            member.user.send({
                embeds: [
                    MessageUtils.generateEmbed("", DataUtils.getConfig(guild).modules.security.verification["welcome-dm"].replace(/{GuildName}/g, guild.name).replace(/{User}/g, member.user.id)
                        , "#44DD66", member.user).setTimestamp().setFooter({text: "Iris Verification"})
                ]
            }).catch(() => {});
        }

        VerificationButtons.removePending(guild, member.user.id);
    }

    /**
     * @description Handles accepting applications as adults
     * @param {ButtonInteraction} interaction The interaction
    */
    async acceptAdultButton(interaction) {
        if (!interaction.inGuild() || !interaction.isButton() || !interaction.channel || !interaction.customId.startsWith("d2ca69928f59-627b2621")) return;
        if (!interaction.member || !PermissionUtils.hasPermission(interaction.member, "VERIFICATION_PROCESS")) return;

        const guild = interaction.guild;
        const user = interaction.customId.split("-")[2] || "";

        const member = await guild.members.fetch(user).catch(() => {});
        if (!member || !member.manageable) return;
        DataUtils.getConfig(guild).modules.security.verification.roles.forEach(async (role) => {
            role = await guild.roles.fetch(role).catch(() => {});
            if (!role) return;

            if (guild.me.roles.highest.comparePositionTo(role) <= 0) return;

            await member.roles.add(role).catch(() => {});
        });

        if (DataUtils.getConfig(guild).modules.security.verification["adult-role"]) {
            const adultRole = await guild.roles.fetch(DataUtils.getConfig(guild).modules.security.verification["adult-role"]).catch(() => {});

            if (guild.me.roles.highest.comparePositionTo(adultRole) > 0) {
                member.roles.add(adultRole).catch(() => {});
            }
        }

        const channel = await guild.channels.fetch(DataUtils.getConfig(guild).modules.security.verification["welcome-channel"]).catch(() => {});
        if (channel instanceof TextChannel) {
            channel.send(DataUtils.getConfig(guild).modules.security.verification["welcome-message"]
                .replace("{User}", member.user.id));
        }

        const applicationAcceptButton = new MessageButton()
            .setCustomId("x-c37c80de")
            .setLabel("Accept")
            .setEmoji("<:Iris_Confirm:973076220516388874>")
            .setStyle("SUCCESS")
            .setDisabled(true);

        const applicationAcceptAdultButton = new MessageButton()
            .setCustomId("x-627b2621")
            .setLabel("Accept as adult")
            .setStyle("SUCCESS")
            .setDisabled(true);

        const applicationRejectButton = new MessageButton()
            .setCustomId("x-1d81a28b")
            .setLabel("Reject")
            .setEmoji("<:Iris_Cancel:973076029654585364>")
            .setStyle("DANGER")
            .setDisabled(true);

        const applicationQuestionButton = new MessageButton()
            .setCustomId("x-f2faaa0d")
            .setLabel("Question")
            .setEmoji("<:Iris_Conversation:973459495139311687>")
            .setStyle("SECONDARY")
            .setDisabled(true);

        const applicationButtons = new MessageActionRow().addComponents(applicationAcceptButton, applicationAcceptAdultButton, applicationRejectButton, applicationQuestionButton);

        const embed = interaction.message.embeds ? interaction.message.embeds[0] : null;
        if (!embed) return;

        embed.setDescription(`**Accepted** by <@${interaction.member.id}>`);
        embed.setColor("#44DD66");

        interaction.update({components: [applicationButtons], embeds: [embed]}).catch(() => {});

        if (DataUtils.getConfig(guild).modules.security.verification["welcome-dm"]) {
            member.user.send({
                embeds: [
                    MessageUtils.generateEmbed("", DataUtils.getConfig(guild).modules.security.verification["accept-message"].replace(/{GuildName}/g, guild.name).replace(/{User}/g, member.user.id)
                        , "#44DD66", member.user).setTimestamp().setFooter({text: "Iris Verification"})
                ]
            }).catch(() => {});
        }

        VerificationButtons.removePending(guild, member.user.id);
    }

    /**
     * @description Handles rejecting applications
     * @param {ButtonInteraction} interaction The interaction
    */
    async rejectButton(interaction) {
        if (!interaction.inGuild() || !interaction.isButton() || !interaction.channel || !interaction.customId.startsWith("d2ca69928f59-1d81a28b")) return;
        if (!interaction.member || !PermissionUtils.hasPermission(interaction.member, "VERIFICATION_PROCESS")) return;

        const guild = interaction.guild;
        const user = interaction.customId.split("-")[2] || "";

        const member = await guild.members.fetch(user).catch(() => {});
        if (!member || !member.manageable) return;

        const modal = new Modal().setCustomId(`d2ca69928f59-7cb983de-${member.id}`)
            .setTitle("Rejecting application")
            .addComponents(
                new MessageActionRow().addComponents(
                    new TextInputComponent().setCustomId("d2ca69928f59-7cb983de-221b18be").setLabel("Reason").setPlaceholder("Reason for rejecting")
                        .setRequired(false).setStyle("PARAGRAPH")
                )
            );

        interaction.showModal(modal);
    }

    /**
     * @description Rejection modals
     * @param {ModalSubmitInteraction} interaction The modal submission
    */
    async rejectModal(interaction) {
        if (!interaction.inGuild() || !interaction.isModalSubmit() || !interaction.channel || !interaction.customId.startsWith("d2ca69928f59-7cb983de")) return;
        if (!interaction.member || !PermissionUtils.hasPermission(interaction.member, "VERIFICATION_PROCESS")) return;

        const guild = interaction.guild;
        const user = interaction.customId.split("-")[2] || "";

        const member = await guild.members.fetch(user).catch(() => {});
        if (!member || !member.manageable) return;

        const applicationAcceptButton = new MessageButton()
            .setCustomId("x-c37c80de")
            .setLabel("Accept")
            .setEmoji("<:Iris_Confirm:973076220516388874>")
            .setStyle("SUCCESS")
            .setDisabled(true);

        const applicationAcceptAdultButton = new MessageButton()
            .setCustomId("x-627b2621")
            .setLabel("Accept as adult")
            .setStyle("SUCCESS")
            .setDisabled(true);

        const applicationRejectButton = new MessageButton()
            .setCustomId("x-1d81a28b")
            .setLabel("Reject")
            .setEmoji("<:Iris_Cancel:973076029654585364>")
            .setStyle("DANGER")
            .setDisabled(true);

        const applicationQuestionButton = new MessageButton()
            .setCustomId("x-f2faaa0d")
            .setLabel("Question")
            .setEmoji("<:Iris_Conversation:973459495139311687>")
            .setStyle("SECONDARY")
            .setDisabled(true);

        const applicationButtons = new MessageActionRow().addComponents(applicationAcceptButton, applicationAcceptAdultButton, applicationRejectButton, applicationQuestionButton);
        const embed = interaction.message.embeds ? interaction.message.embeds[0] : null;
        if (!embed) return;

        const reason = interaction.fields.getTextInputValue("d2ca69928f59-7cb983de-221b18be") && interaction.fields.getTextInputValue("d2ca69928f59-7cb983de-221b18be").length > 0 ?
            interaction.fields.getTextInputValue("d2ca69928f59-7cb983de-221b18be") : "(No reason provided*";

        embed.setColor("#DD4466");
        embed.setDescription(`**Rejected:** ${reason}
            **Rejected by: ** <@${interaction.member.id}>`);

        interaction.update({components: [applicationButtons], embeds: [embed]}).catch(() => {});

        if (DataUtils.getConfig(guild).modules.security.verification["rejection-reason"]) {
            member.user.send({
                embeds: [
                    // eslint-disable-next-line max-len
                    MessageUtils.generateEmbed("Your verification application was rejected.", `Your application in ${guild.name} was rejected for the following reason: ${reason}. Feel free to re-apply at any time.`
                        , "#DD4466", member.user).setTimestamp().setFooter({text: "Iris Verification"})
                ]
            }).catch(() => {});
        } else {
            member.user.send({
                embeds: [
                    MessageUtils.generateEmbed("Your verification application was rejected.", `Your application in ${guild.name} was rejected. Feel free to re-apply at any time.`
                        , "#DD4466", member.user).setTimestamp().setFooter({text: "Iris Verification"})
                ]
            }).catch(() => {});
        }

        VerificationButtons.removePending(guild, member.user.id);
    }

    /**
     * @description Handles questions
     * @param {ButtonInteraction} interaction The interaction
    */
    async questionButton(interaction) {
        if (!interaction.inGuild() || !interaction.isButton() || !interaction.channel || !interaction.customId.startsWith("d2ca69928f59-f2faaa0d")) return;
        if (!interaction.member || !PermissionUtils.hasPermission(interaction.member, "VERIFICATION_PROCESS")) return;

        const guild = interaction.guild;
        const user = interaction.customId.split("-")[2] || "";

        const member = await guild.members.fetch(user).catch(() => {});
        if (!member || !member.manageable) return;

        const applicationAcceptButton = new MessageButton()
            .setCustomId(`d2ca69928f59-c37c80de-${user}`)
            .setLabel("Accept")
            .setEmoji("<:Iris_Confirm:973076220516388874>")
            .setStyle("SUCCESS");

        const applicationAcceptAdultButton = new MessageButton()
            .setCustomId(`d2ca69928f59-627b2621-${user}`)
            .setLabel("Accept as adult")
            .setStyle("SUCCESS");

        const applicationRejectButton = new MessageButton()
            .setCustomId(`d2ca69928f59-1d81a28b-${user}`)
            .setLabel("Reject")
            .setEmoji("<:Iris_Cancel:973076029654585364>")
            .setStyle("DANGER");

        const applicationQuestionButton = new MessageButton()
            .setCustomId("x-f2faaa0d")
            .setLabel("Question")
            .setEmoji("<:Iris_Conversation:973459495139311687>")
            .setStyle("SECONDARY")
            .setDisabled(true);

        const applicationButtons = new MessageActionRow().addComponents(applicationAcceptButton, applicationAcceptAdultButton, applicationRejectButton, applicationQuestionButton);

        interaction.update({components: [applicationButtons]}).catch(() => {});

        if (DataUtils.readUser(member.id, "modmail").open) {
            interaction.reply({embeds: [MessageUtils.generateErrorEmbed("This user already has an open ticket. Try again once they've resolved it.")], ephemeral: true});
            member.user.send({embeds: [
                MessageUtils.generateEmbed("Failed to open questioning",
                    // eslint-disable-next-line max-len
                    `The moderators of ${guild.name} would like to question you about your verification application. However, you already have an open ticket. Please try again once you've resolved it.`,
                    "#DD4466", member.user)
            ]
            }).catch(() => {});
            return;
        }

        const [data, thread, dmChannel] = await ModmailTicketManager.createTicket(interaction.channel, member.user, {
            name: `${member.user.tag}'s Verification Application`,
            reason: "Questioning verification",
            message: interaction.message.id
        }).catch(() => {});

        if (!data || !thread || !dmChannel) return;

        const closeTicketButtonStaff = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(`8e8512aa-${thread.id}`)
                .setLabel("Close ticket")
                .setEmoji("<:Iris_DocumentDelete:973086584444432404>")
                .setStyle("PRIMARY")
        );

        thread.send({embeds: [
            MessageUtils.generateEmbed("Questioning verification",
                // eslint-disable-next-line max-len
                `[View application](${interaction.message.url})\nClose this questioning channel at any time by pressing the \`Close Ticket\` button below. To send a message to this channel only (not visible to the user), prepend \`>\` to it.`, "#4466DD", interaction.user)
                .setFooter({text: "Iris Verification"}).setTimestamp()
                .addField("User", `<@${data.user}>`, true)
                .addField("Thread", `<#${thread.id}>`, true)
        ], components: [closeTicketButtonStaff]});

        dmChannel.send({embeds: [
            MessageUtils.generateEmbed("Verification questioning",
                // eslint-disable-next-line max-len
                "The moderators would like to ask you a few questions about your verification application. Feel free to respond at your own leisure.", "#4466DD", interaction.user)
                .setFooter({text: "Iris Verification"}).setTimestamp()
        ]}).catch(() => {});

        VerificationButtons.removePending(guild, member.user.id);
    }

    /**
     * @description Handles pending applications
     * @param {Guild} guild The guild to get the applications from
     * @return {Array<String>} A list of pending applications
    */
    static getPending(guild) {
        return pendingApplications[guild.id] || [];
    }

    /**
     * @description Creates a pending application
     * @param {Guild} guild The guild to add to
     * @param {String} user The ID of the user to add
    */
    static addPending(guild, user) {
        pendingApplications[guild.id] = pendingApplications[guild.id] || [];
        pendingApplications[guild.id].push(user);
    }

    /**
     * @description Removes a pending application
     * @param {Guild} guild The guild to remove from
     * @param {String} user The ID of the user to remove
    */
    static removePending(guild, user) {
        pendingApplications[guild.id] = pendingApplications[guild.id] || [];
        pendingApplications[guild.id] = pendingApplications[guild.id].filter((u) => u !== user);
    }
}

module.exports = VerificationButtons;
