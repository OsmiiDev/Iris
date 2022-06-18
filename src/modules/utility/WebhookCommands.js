const {GuildMember, WebhookClient} = require("discord.js");
const DataUtils = require("../../utility/DataUtils");
const MessageUtils = require("../../utility/MessageUtils");
const PermissionUtils = require("../../utility/PermissionUtils");

const IrisModule = require("../IrisModule");

/**
 * @description Handles commands for interactions with webhooks
*/
class WebhookCommands extends IrisModule {
    LISTENERS = [
        {event: "messageCreate", function: this.messageCreate}
    ];

    /**
     * @description Constructor
    */
    constructor() {
        super("utility.WebhookCommands");

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
            WebhookCommands.send(message);
        }
        if (command === "list") {
            WebhookCommands.list(message);
        }
    }

    /**
     * @description Send messages to webhooks
     * @param {Message} message The message to handle
    */
    static async send(message) {
        if (!PermissionUtils.hasPermission(message.member, "WEBHOOK_SEND")) return;

        const split = message.content.split(" ");

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

    /**
     * @description List a guild's webhooks along with linked ones
     * @param {Message} message The message to handle
    */
    static async list(message) {
        if (!PermissionUtils.hasPermission(message.member, "WEBHOOK_LIST")) return;

        const webhooks = DataUtils.read(message.guild, "utility/webhooks");
        const guildWebhooks = await message.guild.fetchWebhooks();

        const embeds = [];
        guildWebhooks.forEach((guildWebhook) => {
            if (!guildWebhook.token) return;
            const embed = MessageUtils.generateEmbed(guildWebhook.name, `**URL • **${guildWebhook.url}\n**Channel • **<#${guildWebhook.channelId}>`, "#4466DD");
            embed.setThumbnail(guildWebhook.avatarURL);
            embed.setAuthor({name: `Created by ${guildWebhook.owner.tag}`, iconURL: guildWebhook.owner.avatarURL});
            embed.setFooter({text: "Created"}).setTimestamp(guildWebhook.createdAt);

            Object.entries(webhooks).forEach(([webhookID, webhookURL]) => {
                if (webhookURL === guildWebhook.url) {
                    embed.setDescription(`**ID • **${webhookID}\n${embed.description}`);
                }
            });

            embeds.push(embed);
        });

        embeds.chunk(10).forEach((embed, index) => {
            if (index === 0) {
                return message.reply({embeds: embeds});
            } else {
                message.channel.send({embeds: embed});
            }
        });
    }
}

module.exports = WebhookCommands;
