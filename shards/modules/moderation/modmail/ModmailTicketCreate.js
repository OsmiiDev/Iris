const { ButtonInteraction, GuildMember, MessageButton, MessageActionRow, TextChannel } = require("discord.js");

const DataUtils = require("../../../utility/DataUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");
const MessageUtils = require("../../../utility/MessageUtils");

const ModmailTicketManager = ModuleUtils.getModule("moderation.modmail.ModmailTicketManager");

const IrisModule = ModuleUtils.getModule("core.IrisModule");

class ModmailTicketCreate extends IrisModule {

    LISTENERS = [
        { event: "messageCreate", function: this.send },
        { event: "interactionCreate", function: this.createTicket },
        { event: "interactionCreate", function: this.createTicketConfirm },
        { event: "interactionCreate", function: this.createTicketCancel },
    ];

    constructor() {
        super("moderation.modmail.ModmailTicketCreate");
        this.registerEvents();
    }

    async send(message) {
        if (!message.content.startsWith("EMBED 6a0e2176c84c") || !message.guild || !message.member || !message.member.permissions.has("ADMINISTRATOR")) { return; }

        let buttonRow = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("6a0e2176c84c")
                .setLabel("Create Ticket")
                .setEmoji("<:Iris_Conversation:973459495139311687>")
                .setStyle("PRIMARY")
        );

        message.channel.send({
            components: [buttonRow], embeds: [
                MessageUtils.generateEmbed("Open a modmail ticket",
                    "Clicking this button will open a private channel between you and staff. This will allow you to chat one-on-one with staff members. Please only use modmail for serious inquiries such as user reports or mute appeals!\n\n*Abuse of modmail is a bannable offense!*",
                    "#4466DD")
            ]
        });
    }

    /**
     * @description Handles the initial button press
     * @param {ButtonInteraction} interaction The button interaction 
    */
    async createTicket(interaction) {
        if (!interaction.inGuild() || !interaction.member || !interaction.isButton()) { return; }
        if (interaction.customId !== "6a0e2176c84c") { return; }

        if (!interaction.guild.me.permissions.has("ADMINISTRATOR")) { return; }

        if (DataUtils.readUser(interaction.member.id, "modmail").open) {
            interaction.reply({ embeds: [MessageUtils.generateErrorEmbed("You already have an open ticket!")], ephemeral: true })
        }
        else {
            let createTicketButton = new MessageButton()
                .setCustomId("feeec982")
                .setLabel("Yes, create my ticket")
                .setEmoji("<:Iris_Confirm:973076220516388874>")
                .setStyle("SUCCESS");

            let cancelTicketButton = new MessageButton()
                .setCustomId("0e87e23f")
                .setLabel("No, cancel")
                .setEmoji("<:Iris_Cancel:973076029654585364>")
                .setStyle("DANGER");

            interaction.reply({ components: [new MessageActionRow().addComponents(createTicketButton, cancelTicketButton)], ephemeral: true })
        }
    }

    /**
     * @description Handles the confirmation of the ticket creation
     * @param {ButtonInteraction} interaction The button interaction
    */
    async createTicketConfirm(interaction) {
        if (!interaction.inGuild() || !interaction.member || !interaction.isButton()) { return; }
        if (interaction.customId !== "feeec982") { return; }

        if (!interaction.guild.me.permissions.has("ADMINISTRATOR")) { return; }

        if (DataUtils.readUser(interaction.member.id, "modmail").open) {
            interaction.reply({ embeds: [MessageUtils.generateErrorEmbed("You already have an open ticket!")], ephemeral: true })
        }
        else {
            let channel = await interaction.guild.channels.fetch(DataUtils.getConfig(interaction.guild).modules.moderation.modmail.channel);
            if (!(channel instanceof TextChannel)) { return console.log("?"); }

            let [data, thread, dm] = await ModmailTicketManager.createTicket(channel, interaction.user, { "name": `${interaction.user.username}'s Modmail Ticket` });
            if (!data) { return interaction.reply({ embeds: [MessageUtils.generateErrorEmbed("Failed to DM the user.")] }); }

            let closeTicketButtonStaff = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId("8e8512aa")
                    .setLabel("Close ticket")
                    .setEmoji("<:Iris_DocumentDelete:973086584444432404>")
                    .setStyle("PRIMARY")
            );

            let closeTicketButtonUser = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId(`73926dee-${interaction.guildId}`)
                    .setLabel("Close ticket")
                    .setEmoji("<:Iris_DocumentDelete:973086584444432404>")
                    .setStyle("PRIMARY")
            );

            thread.send({ embeds: [
                MessageUtils.generateEmbed("Modmail Ticket Created", "Close this ticket at any time by pressing the `Close Ticket` button below. To send a message to this channel only (not visible to the user), prepend `>` to it.", "#4466DD", interaction.user)
                    .setFooter({ text: "Iris Modmail"}).setTimestamp()
                    .addField("User", `<@${data.user}>`, true)
                    .addField("Thread", `<#${thread.id}>`, true)
            ], components: [closeTicketButtonStaff] });

            dm.send({ embeds: [
                MessageUtils.generateEmbed("Modmail Ticket Created", "Close this ticket at any time by pressing the `Close Ticket` button below or leaving the server in which it was created. Any messages you send to this channel will be visible by staff for the duration of your ticket.", "#4466DD", interaction.user)
                    .setFooter({ text: "Iris Modmail"}).setTimestamp()
            ], components: [closeTicketButtonUser] }).catch(() => {});
        }
    }

    /**
     * @description Handles the cancellation of the ticket creation
     * @param {ButtonInteraction} interaction The button interaction
    */
    async createTicketCancel(interaction) {
        if (!interaction.inGuild() || !interaction.member || !interaction.isButton()) { return; }
        if (interaction.customId !== "0e87e23f") { return; }

        interaction.reply({
            embeds: [
                MessageUtils.generateEmbed("Ticket cancelled",
                    "You can now dismiss both of these messages. To create a ticket you may click the 'create ticket' button at any time.",
                    "#4466DD", interaction.user).setFooter({ text: "Iris Tickets" }).setTimestamp()
            ], ephemeral: true
        })
    }
    
}

module.exports = ModmailTicketCreate;