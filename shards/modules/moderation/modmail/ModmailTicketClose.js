const { ButtonInteraction, GuildMember, MessageButton, MessageActionRow, TextChannel, Guild, Modal, TextInputComponent, ModalSubmitInteraction, User, ThreadMemberFlags, ThreadChannel } = require("discord.js");

const MessageUtils = require("../../../utility/MessageUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");
const PermissionUtils = require("../../../utility/PermissionUtils");

const ModmailTicketManager = require("./ModmailTicketManager");

const IrisModule = require("../../IrisModule");

class ModmailTicketClose extends IrisModule {

    LISTENERS = [
        { event: "interactionCreate", function: this.closeTicketModerator },
        { event: "interactionCreate", function: this.closeTicketModal },
        { event: "interactionCreate", function: this.closeTicketUser },
        { event: "guildMemberRemove", function: this.closeTicketLeave }
    ];

    constructor() {
        super("moderation.modmail.ModmailTicketClose");
        this.registerEvents();
    }

    /**
     * @description Handles ticket closing on the moderator's side
     * @param {ButtonInteraction} interaction The button interaction 
    */
    async closeTicketModerator(interaction) {
        if (!interaction.isButton() || !interaction.inGuild() || !interaction.channel || interaction.customId !== "8e8512aa") { return; }
        if (!PermissionUtils.hasPermission(interaction.member, "MODERATION_MODMAIL_TICKET_CLOSE")) { return; }

        if (!interaction.guild.me.permissions.has("ADMINISTRATOR")) { return; }

        let ticket = await ModmailTicketManager.getTicket(interaction.channel);
        if (!ticket) { return; }

        let closeModal = new Modal().setCustomId("87ab4ab166d9").setTitle("Closing ticket").addComponents(new MessageActionRow().addComponents(
            new TextInputComponent()
                .setCustomId("a050c5f2")
                .setLabel("Reason")
                .setPlaceholder("Reason for closing the ticket")
                .setStyle("PARAGRAPH")
                .setRequired(true)
        ))

        interaction.showModal(closeModal)
    }

    /**
     * @description Handles modal submission for ticket close
     * @param {ModalSubmitInteraction} interaction 
     */
    async closeTicketModal(interaction) {
        if (!interaction.isModalSubmit() || !interaction.guild || !interaction.channel || interaction.customId !== "87ab4ab166d9") { return; }

        if (!interaction.guild.me.permissions.has("ADMINISTRATOR")) { return; }

        let ticket = await ModmailTicketManager.getTicket(interaction.channel);
        if (!ticket && interaction.channel instanceof TextChannel) { return interaction.reply({ embeds: [MessageUtils.generateErrorEmbed("You can't close this ticket from here. Open the thread and try again.")] }); }
        else if (!ticket) { return interaction.reply({ embeds: [MessageUtils.generateErrorEmbed("This is not a modmail ticket.")] }); }

        let reason = interaction.fields.getTextInputValue("a050c5f2");
        if (!reason) { return; }

        await interaction.reply({
            embeds: [
                MessageUtils.generateEmbed("Ticket closed", "This ticket was closed by a staff member. Messages will no longer be sent or received between this channel and the user.", "#4466DD", interaction.user)
                    .addField("Moderator", `<@${interaction.member.id}>`, true)
                    .addField("Reason", reason, true)
                    .setFooter({ text: "Iris Modmail" }).setTimestamp()
            ]
        });

        let member = await interaction.guild.members.fetch(ticket.user).catch(() => {});
        if (member instanceof GuildMember) {
            member.user.send({
                embeds: [
                    MessageUtils.generateEmbed("Ticket closed", "Your ticket was closed by a moderator. You can open another ticket at any time by pressing the `Open ticket` button.", "#4466DD", member.user)
                        .addField("Reason", reason, true)
                        .setFooter({ text: "Iris Modmail" }).setTimestamp()
                ]
            }).catch(() => { });
        }

        let [data, thread] = await ModmailTicketManager.closeTicket(member);
        if (!thread) { return; }

        await thread.setName(`[Closed] ${thread.name}`);
        await thread.setArchived(true, reason);
    }

    /**
     * @description Closes a modmail ticket on the user's side
     * @param {ButtonInteraction} interaction 
     */
    async closeTicketUser(interaction) {
        if (!interaction.isButton() || !interaction.channel || !interaction.customId.startsWith("73926dee-")) { return; }

        let guild = await process.client.guilds.fetch(interaction.customId.split("-")[1]);

        if (!interaction.guild.me.permissions.has("ADMINISTRATOR")) { return; }

        let ticket = await ModmailTicketManager.getTicket(interaction.channel);
        if (!ticket) { return; }

        let member = await guild.members.fetch(ticket.user).catch(() => {});
        if (!(member instanceof GuildMember)) { return; }

        let [data, thread] = await ModmailTicketManager.closeTicket(member);
        if (!data && !thread) { return; }

        let closeTicketButtonUser = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(`73926dee-${interaction.guildId}`)
                .setLabel("Close ticket")
                .setEmoji("<:Iris_DocumentDelete:973086584444432404>")
                .setStyle("PRIMARY")
                .setDisabled(true)
        );

        await interaction.update({ components: [closeTicketButtonUser] }).catch(() => { });

        if (thread instanceof ThreadChannel) {
            thread.send({
                embeds: [
                    MessageUtils.generateEmbed("Ticket closed", "This ticket was closed by the user. Messages will no longer be sent or received between this channel and the user.", "#4466DD", interaction.user)
                        .addField("User", `<@${interaction.user.id}>`, true)
                        .addField("Reason", "Closed by user", true)
                        .setFooter({ text: "Iris Modmail" }).setTimestamp()
                ]
            });
        }

        if (member instanceof GuildMember) {
            member.user.send({
                embeds: [
                    MessageUtils.generateEmbed("Ticket closed", "You closed this modmail ticket. You can open another ticket at any time by pressing the `Open ticket` button.", "#4466DD", member.user)
                        .addField("Reason", "Closed by user", true)
                        .setFooter({ text: "Iris Modmail" }).setTimestamp()
                ]
            }).catch(() => { });
        }

        await thread.setName(`[Closed] ${thread.name}`);
        await thread.setArchived(true, "Closed by user");
    }

    /**
     * @description Closes the ticket whenever the member leaves the server 
     * @param {GuildMember} member The member that just left
    */
    async closeTicketLeave(member) {
        let ticket = await ModmailTicketManager.getOpenData(member.guild)[member.id];
        if (!ticket) { return; }

        let [data, thread] = await ModmailTicketManager.closeTicket(member);
        if (!data) { return; }
        
        if (!member.guild.me.permissions.has("ADMINISTRATOR")) { return; }

        if (thread instanceof ThreadChannel) {
            thread.send({
                embeds: [
                    MessageUtils.generateEmbed("Ticket closed", "This ticket was closed automatically because the user left the server. Messages will no longer be sent or received between this channel and the user.", "#4466DD", member.user)
                        .addField("User", `<@${member.user.id}>`, true)
                        .addField("Reason", "Closed due to user leaving", true)
                        .setFooter({ text: "Iris Modmail" }).setTimestamp()
                ]
            });
        }

        await thread.setName(`[Closed] ${thread.name}`);
        await thread.setArchived(true, "Closed by user");
    }

}

module.exports = ModmailTicketClose;