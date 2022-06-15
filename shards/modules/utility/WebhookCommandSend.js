const {GuildMember, WebhookClient} = require("discord.js");
const DataUtils = require("../../utility/DataUtils");
const MessageUtils = require("../../utility/MessageUtils");
const PermissionUtils = require("../../utility/PermissionUtils");

const IrisModule = require("../IrisModule");

/**
 * @description Handles commands for interactions with webhooks
*/
class WebhookCommandSend extends IrisModule {
    LISTENERS = [
        {event: "messageCreate", function: this.messageCreate}
    ];

    /**
     * @description Constructor
    */
    constructor() {
        super("utility.WebhookCommandSend");

        this.registerEvents();
    }

    /**
     * @description Handles messages
     * @param {Message} message The message to handle
    */
    async messageCreate(message) {
        if (!message.inGuild() || !(message.member instanceof GuildMember) || !message.channel) return;
        if (message.author.bot || message.author.system) return;

        if (!MessageUtils.isCommand(message, "webhook")) return;

        const split = message.content.split(" ");
        const command = split[1];

        message.suppressEmbeds();
        if (command === "send") {
            if (!PermissionUtils.hasPermission(message.member, "WEBHOOK_SEND")) return;

            if (!message.reference) {
                return message.reply({embeds: [MessageUtils.generateErrorEmbed("You must reply to a message to send it to a webhook.")]});
            }

            if (split.length < 3) {
                return message.reply({embeds: [MessageUtils.generateErrorEmbed("You must specify a webhook URL or ID to send the message to.")]});
            }

            let webhook = split[2];

            if (!webhook.startsWith("https://discord.com/api/webhooks/")) {
                webhook = DataUtils.read(message.guild, "utility/webhooks")[webhook.toLowerCase()];
            }

            if (!webhook) return message.reply({embeds: [MessageUtils.generateErrorEmbed("Invalid webhook URL or ID.")]});

            const webhookClient = new WebhookClient({url: webhook});
            if (!(webhookClient instanceof WebhookClient)) {
                return message.reply({
                    embeds: [
                        MessageUtils.generateErrorEmbed("Couldn't find that webhook. Make sure you provided a valid webhook URL or ID.")
                    ]
                });
            }

            const reference = await message.fetchReference();
            const body = {};

            const avatarURL = split.length >= 4 ? split[3] : undefined;
            const name = split.length >= 5 ? MessageUtils.replaceClyde(split.slice(4).join(" ")) : undefined;

            if (reference.content) body.content = reference.content;
            if (reference.attachments) body.files = Array.from(reference.attachments.values());
            if (avatarURL) body.avatarURL = avatarURL;
            if (name) body.username = name;

            const webhookMessage = await webhookClient.send(body).catch(() => { });
            if (!webhookMessage) {
                return message.reply({
                    embeds: [
                        MessageUtils.generateErrorEmbed("Couldn't send the message to the webhook. Make sure you provided a valid webhook URL or ID.")
                    ]
                });
            }

            const channel = await message.guild.channels.fetch(webhookMessage.channel_id);
            const wmessage = await channel.messages.fetch(webhookMessage.id);

            return message.reply({
                embeds: [
                    MessageUtils.generateEmbed("", `<:Iris_TickYes:977399754969448520> The message was successfully sent to the webhook. [View message](${wmessage.url})`,
                        "#44DD66", message.author)
                ]
            });
        }
    }
}

module.exports = WebhookCommandSend;
