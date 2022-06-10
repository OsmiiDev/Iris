const { Message, ThreadChannel, GuildManager, GuildMember, DMChannel, Webhook } = require("discord.js");

const MessageUtils = require("../../../utility/MessageUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");

const ModmailTicketManager = ModuleUtils.getModule("moderation.modmail.ModmailTicketManager");

const IrisModule = ModuleUtils.getModule("core.IrisModule");

class ModmailTicketLink extends IrisModule {

    LISTENERS = [
        { event: "messageCreate", function: this.threadToDM },
        { event: "messageCreate", function: this.DMToThread }
    ];

    constructor() {
        super("moderation.modmail.ModmailTicketLink");
        this.registerEvents();
    }

    /**
     * @description Handles messages from the thread channel to the user's DMs
     * @param {Message} message The sent message
    */
    async threadToDM(message) {
        if (message.author.bot || (message.content && message.content.startsWith(">"))) { return; }
        if (!(message.channel instanceof ThreadChannel)) { return; }

        let ticket = ModmailTicketManager.getTicket(message.channel);
        if (!ticket) { return; }

        let member = await message.guild.members.fetch(ticket.user).catch(() => {});
        if (!(member instanceof GuildMember)) { return; }

        let body = {};

        if (message.content) { body.content = message.content; }
        if (message.attachments) { body.files = Array.from(message.attachments.values()); }

        member.user.send(body).catch(() => { });
    }

    /**
     * @description Handles messages from the DM channel to the modmail thread
     * @param {Message} message The sent message
    */
    async DMToThread(message) {
        if (message.author.bot || message.channel.type !== "DM") { return; }

        let ticket = ModmailTicketManager.getTicket(message.channel);
        if (!ticket) { return; }

        let thread = await process.client.channels.fetch(ticket.threadChannel);
        if (!(thread instanceof ThreadChannel)) { return; }

        if (!thread.guild.me.permissions.has("ADMINISTRATOR")) { return; }

        let member = await thread.guild.members.fetch(ticket.user).catch(() => {});
        if (!(member instanceof GuildMember)) { return; }

        let body = {};

        if (message.content) { body.content = message.content; }
        if (message.attachments) { body.files = Array.from(message.attachments.values()); }

        let webhooks = await thread.parent.fetchWebhooks();
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