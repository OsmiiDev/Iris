const {MessageButton, MessageActionRow, Modal, TextInputComponent, TextChannel} = require("discord.js");
const crypto = require("crypto");
const DataUtils = require("../../../utility/DataUtils");
const MessageUtils = require("../../../utility/MessageUtils");
const IrisModule = require("../../IrisModule");
const VerificationButtons = require("./VerificationButtons");

const openApplications = {};
const tokens = {};

/**
 * @description Handles verification
*/
class VerificationModals extends IrisModule {
    LISTENERS = [
        {event: "messageCreate", function: this.send},
        {event: "interactionCreate", function: this.beginVerification},
        {event: "interactionCreate", function: this.handlePageButtons},
        {event: "interactionCreate", function: this.handleSubmit}
    ];
    /**
     * @description Constructor
    */
    constructor() {
        super("security.VerificationModals");

        this.registerEvents();
    }

    /**
     * @description sends message
     * @param {Message} message
    */
    async send(message) {
        if (!message.content.startsWith("EMBED a9897609d4ad") || !message.guild || !message.member || !message.member.permissions.has("ADMINISTRATOR")) return;

        const buttonRow = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("a9897609d4ad")
                .setLabel("Begin Verification")
                .setEmoji("<:Iris_Shield_Key:986743689999163463>")
                .setStyle("SUCCESS")
        );

        message.channel.send({
            components: [buttonRow], embeds: [
                MessageUtils.generateEmbed("Begin verification",
                    // eslint-disable-next-line max-len
                    "Verification stuff, click button, this is just to make sure you're not a troll, etc etc",
                    "#4466DD")
            ]
        });
    }

    /**
     * @description Begins the verification process
     * @param {ButtonInteraction} interaction The button interaction
    */
    async beginVerification(interaction) {
        if (!interaction.isButton() || !interaction.inGuild() || !interaction.channel || interaction.customId !== "a9897609d4ad") return;
        if (VerificationButtons.getPending(interaction.guild.id).includes(interaction.member.id)) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("You already have a pending verification application.")], ephemeral: true});
        }

        let questions = DataUtils.getConfig(interaction.guild).modules.security.verification.questions;
        let components = [];
        questions = questions.chunk(4);

        questions.forEach((q, index) => {
            components.push(new MessageButton().setCustomId(`97f97e1e2ff0-${index}`)
                .setStyle("PRIMARY")
                .setLabel(`Page ${index + 1}`));
        });


        if (DataUtils.getConfig(interaction.guild).modules.security.verification["anti-alt"]) {
            const token = crypto.randomBytes(16).toString("hex");
            components.push(new MessageButton()
                .setURL(`https://iris.app/verify?for=${interaction.guild.id}&token=${token}`)
                .setLabel("Complete verification")
                .setStyle("LINK")
            );

            tokens[token] = `${interaction.guild.id}:${interaction.member.id}`;
        }

        if (!openApplications[interaction.guild.id]) openApplications[interaction.guild.id] = {};
        openApplications[interaction.guild.id][interaction.member.id] = [];

        components = components.chunk(5);
        const rows = [];

        components.forEach((c) => {
            rows.push(new MessageActionRow().addComponents(...c));
        });

        interaction.reply({ephemeral: true, components: rows});
    }

    /**
     * @description Handles page buttons
     * @param {ButtonInteraction} interaction The button interaction
    */
    async handlePageButtons(interaction) {
        if (!interaction.isButton() || !interaction.inGuild() || !interaction.channel || interaction.customId.split("-")[0] !== "97f97e1e2ff0") return;
        const page = interaction.customId.split("-")[1] * 1;

        if (!openApplications[interaction.guild.id] || !openApplications[interaction.guild.id][interaction.member.id]) return;
        const expectedPage = openApplications[interaction.guild.id][interaction.member.id].length;

        if (page < expectedPage) {
            return interaction.reply({
                ephemeral: true,
                embeds: [MessageUtils.generateErrorEmbed(`You've already done this page. You're on page ${expectedPage + 1}.`)]
            });
        }
        if (page > expectedPage) {
            return interaction.reply({
                ephemeral: true,
                embeds: [MessageUtils.generateErrorEmbed(`Go in order. You're on page ${(expectedPage + 1)}.`)]
            });
        }

        let questions = DataUtils.getConfig(interaction.guild).modules.security.verification.questions;
        const components = [];
        questions = questions.chunk(4);
        questions[page].forEach((question, index) => {
            components.push(new MessageActionRow().addComponents(
                new TextInputComponent()
                    .setCustomId(`894c5e2c-${page * 4 + index}`)
                    .setLabel(question.question)
                    .setPlaceholder(question.placeholder)
                    .setRequired(true)
                    .setStyle(question.type === "short" ? "SHORT" : "PARAGRAPH"))
            );
        });

        const verificationModal = new Modal().setCustomId(`97f97e1e2ff0-${page}-${questions.length - 1}`)
            .setTitle(`Verification - Page ${page + 1} of ${questions.length}`)
            .addComponents(...components);

        interaction.showModal(verificationModal);
    }
    /**
     * @description Handles pages submit
     * @param {ModalSubmitInteraction} interaction The modal submit interaction
    */
    async handleSubmit(interaction) {
        if (!interaction.isModalSubmit() || !interaction.inGuild() || !interaction.channel || !interaction.customId.startsWith("97f97e1e2ff0")) return;
        if (!openApplications[interaction.guild.id] || !openApplications[interaction.guild.id][interaction.member.id]) return;

        if (VerificationButtons.getPending(interaction.guild.id).includes(interaction.member.id)) {
            return interaction.reply({embeds: [MessageUtils.generateErrorEmbed("You already have a pending verification application.")], ephemeral: true});
        }

        const page = interaction.customId.split("-")[1] * 1;
        const questions = DataUtils.getConfig(interaction.guild).modules.security.verification.questions;

        const responses = [];
        for (let i = 0; i < 4; i ++) {
            if (!interaction.components[i]) continue;
            responses.push(interaction.fields.getTextInputValue(`894c5e2c-${page * 4 + i}`) || "No reponse");
        }

        openApplications[interaction.guild.id][interaction.member.id].push(responses);

        if (openApplications[interaction.guild.id][interaction.member.id].flat().length === questions.length) {
            if (DataUtils.getConfig(interaction.guild).modules.security.verification["anti-alt"]) {
                interaction.reply({
                    ephemeral: true,
                    embeds: [
                        MessageUtils.generateEmbed("Almost done!",
                            "To finialize your application, please click on the link above. This is to protect against alt accounts and punishment evasion.",
                            "#4466DD", interaction.user).setThumbnail(interaction.user.avatarURL()).setFooter({text: "Iris Verification"}).setTimestamp()
                    ]
                });
            } else {
                const response = DataUtils.getConfig(interaction.guild).modules.security.verification.response;

                interaction.reply({
                    ephemeral: true,
                    embeds: [
                        MessageUtils.generateEmbed(response.title, response.description, "#4466DD", interaction.user)
                            .setThumbnail(interaction.user.avatarURL()).setFooter({text: "Iris Verification"}).setTimestamp()
                    ]
                });

                const application = openApplications[interaction.guild.id][interaction.member.id].flat();
                const embed = MessageUtils.generateEmbed(`${interaction.member.user.tag}'s Verification Application`,
                    "", "#4466DD", interaction.user)
                    .addField("Account Created", `<t:${Math.floor(interaction.member.joinedAt.getTime()/1000)}:f>`, true)
                    .addField("Joined At", `<t:${Math.floor(interaction.user.createdAt.getTime()/1000)}:f>`, true)
                    .addField(`ID: ${interaction.user.id}`, `<@${interaction.user.id}>`, false)
                    .addField("\u200b", "\u200b", false)
                    .setThumbnail(interaction.user.avatarURL())
                    .setFooter({text: "Iris Verification"}).setTimestamp();

                application.forEach((answer, index) => {
                    embed.addField(questions[index].question, answer, true);
                });

                const applicationAcceptButton = new MessageButton()
                    .setCustomId(`d2ca69928f59-c37c80de-${interaction.member.id}`)
                    .setLabel("Accept")
                    .setEmoji("<:Iris_Confirm:973076220516388874>")
                    .setStyle("SUCCESS");

                const applicationAcceptAdultButton = new MessageButton()
                    .setCustomId(`d2ca69928f59-627b2621-${interaction.member.id}`)
                    .setLabel("Accept as adult")
                    .setStyle("SUCCESS");

                const applicationRejectButton = new MessageButton()
                    .setCustomId(`d2ca69928f59-1d81a28b-${interaction.member.id}`)
                    .setLabel("Reject")
                    .setEmoji("<:Iris_Cancel:973076029654585364>")
                    .setStyle("DANGER");

                const applicationQuestionButton = new MessageButton()
                    .setCustomId(`d2ca69928f59-f2faaa0d-${interaction.member.id}`)
                    .setLabel("Question")
                    .setEmoji("<:Iris_Conversation:973459495139311687>")
                    .setStyle("SECONDARY");

                const buttons = new MessageActionRow().addComponents(applicationAcceptButton, applicationAcceptAdultButton, applicationRejectButton, applicationQuestionButton);

                const channel = interaction.guild.channels.cache.get(DataUtils.getConfig(interaction.guild).modules.security.verification.channel);
                if (channel instanceof TextChannel) {
                    channel.send({embeds: [embed], components: [buttons]});
                }
                openApplications[interaction.guild.id][interaction.member.id] = undefined;

                VerificationButtons.addPending(interaction.guild.id, interaction.member.id);
                return;
            }
        } else {
            interaction.reply({embeds: [MessageUtils.generateEmbed(`Page Submitted • Please move on to the next page (${page + 2})`, "", "#4466DD", interaction.user)], ephemeral: true});
        }
    }
}

module.exports = VerificationModals;
