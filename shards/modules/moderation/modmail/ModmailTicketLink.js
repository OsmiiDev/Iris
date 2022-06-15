const {ThreadChannel, GuildMember} = require("discord.js");

const MessageUtils = require("../../../utility/MessageUtils");

const ModmailTicketManager = require("./ModmailTicketManager");

const IrisModule = require("../../IrisModule");

/**
 * @description Handles communication between the thread and DM channels in a modmail ticket
*/
class ModmailTicketLink extends IrisModule {
    LISTENERS = [
        {event: "messageCreate", function: this.threadToDM},
        {event: "messageCreate", function: this.DMToThread}
    ];

    /**
     * @description Constructor
    */
    constructor() {
        super("moderation.modmail.ModmailTicketLink");
        this.registerEvents();
    }

    /**
     * @description Handles messages from the thread channel to the user's DMs
     * @param {Message} message The sent message
    */
    async threadToDM(message) {
        if (message.author.bot || (message.content && message.content.startsWith(">"))) {
            return;
        }
        if (!(message.channel instanceof ThreadChannel)) {
            return;
        }

        const ticket = ModmailTicketManager.getTicket(message.channel);
        if (!ticket) {
            return;
        }

        const member = await message.guild.members.fetch(ticket.user).catch(() => {});
        if (!(member instanceof GuildMember)) {
            return;
        }

        const body = {};

        if (message.content) {
            body.content = message.content;
        }
        if (message.attachments) {
            body.files = Array.from(message.attachments.values());
        }

        member.user.send(body).catch(() => { });
    }

    /**
     * @description Handles messages from the DM channel to the modmail thread
     * @param {Message} message The sent message
    */
    async DMToThread(message) {
        if (message.author.bot || message.channel.type !== "DM") {
            return;
        }

        const ticket = ModmailTicketManager.getTicket(message.channel);
        if (!ticket) {
            return;
        }

        const thread = await process.client.channels.fetch(ticket.threadChannel);
        if (!(thread instanceof ThreadChannel)) {
            return;
        }

        if (!thread.guild.me.permissions.has("ADMINISTRATOR")) {
            return;
        }

        const member = await thread.guild.members.fetch(ticket.user).catch(() => {});
        if (!(member instanceof GuildMember)) {
            return;
        }

        const body = {};

        if (message.content) {
            body.content = message.content;
        }
        if (message.attachments) {
            body.files = Array.from(message.attachments.values());
        }

        const webhooks = await thread.parent.fetchWebhooks();
        let webhook = webhooks.first();
        if (webhooks.size === 0) {
            webhook = await thread.parent.createWebhook("Iris", thread.guild.me.user.avatarURL());
        }

        webhook.send({
            ...body,
            threadId: ticket.threadChannel,
            username: `${MessageUtils.replaceClyde(member.user.username)}#${member.user.discriminator}`,
            avatarURL: member.user.displayAvatarURL()
        }).catch((error) => { });
    }
}

module.exports = ModmailTicketLink;
