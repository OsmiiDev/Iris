const {MessageButton, MessageActionRow, TextChannel} = require("discord.js");
const DataUtils = require("../../../utility/DataUtils");
const MessageUtils = require("../../../utility/MessageUtils");
const PermissionUtils = require("../../../utility/PermissionUtils");
const IrisModule = require("../../IrisModule");
const ModmailTicketManager = require("../../moderation/modmail/ModmailTicketManager");

/**
 * @description Handles buttons for verification applications (accept, reject, question)
*/
class VerificationButtons extends IrisModule {
    LISTENERS = [
        {event: "interactionCreate", function: this.acceptButton},
        {event: "interactionCreate", function: this.acceptAdultButton},
        {event: "interactionCreate", function: this.rejectButton},
        {event: "interactionCreate", function: this.questionButton}

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

        interaction.update({components: [applicationButtons]}).catch(() => {});
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

        interaction.update({components: [applicationButtons]}).catch(() => {});
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

        interaction.update({components: [applicationButtons]}).catch(() => {});
    }

    /**
     * @description Handles questions
     * @param {ButtonInteraction} interaction The interaction
    */
    async questionButton(interaction) {
        if (!interaction.inGuild() || !interaction.isButton() || !interaction.channel || !interaction.customId.startsWith("d2ca69928f59-f2faaa0d")) return;
        if (!interaction.member || !PermissionUtils.hasPermission(interaction.member, "VERIFICATION_PROCESS")) return;

        console.log("q");
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

        const [data, thread, dmChannel] = await ModmailTicketManager.createTicket(interaction.channel, member.user, {
            name: `${member.user.tag}'s Verification Application`,
            reason: "Questioning verification",
            message: interaction.message
        }).catch((error) => {
            console.log("error: " + error);
        });

        if (!data || !thread || !dmChannel) return;

        const closeTicketButtonStaff = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("8e8512aa")
                .setLabel("Close ticket")
                .setEmoji("<:Iris_DocumentDelete:973086584444432404>")
                .setStyle("PRIMARY")
        );

        thread.send({embeds: [
            MessageUtils.generateEmbed("Questioning verification",
                // eslint-disable-next-line max-len
                "Close this questioning channel at any time by pressing the `Close Ticket` button below. To send a message to this channel only (not visible to the user), prepend `>` to it.", "#4466DD", interaction.user)
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
    }
}

module.exports = VerificationButtons;
