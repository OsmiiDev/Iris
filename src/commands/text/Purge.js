const {MessageEmbed} = require("discord.js");
const DataUtils = require("../../utility/DataUtils");
const MessageUtils = require("../../utility/MessageUtils");
const TextCommand = require("../TextCommand");

const helpEmbed = MessageUtils.generateEmbed("{prefix}purge",
    `**Description**: Purges messages in a text channel, up to the past 1000 messages.
    **Cooldown**: 1 second

    **Usage**
    **{prefix}purge <amount | time> [member]** • Purges the specified amount of messages in the current channel, with an optional member to filter for

    **Examples**
    {prefix}purge 10
    {prefix}purge 5 @Osmii
    {prefix}purge 1w @Osmii`, "#4466DD").toJSON();

/**
 * @description Handles purging messages
*/
class Purge extends TextCommand {
    /**
     * @description Constructor
    */
    constructor() {
        super("purge", ["clear", "clean"], Purge.run);
    }

    /**
     * @description Purges messages
     * @param {Message} message The message to handle
     * @param {Array<String>} args The arguments of the command
    */
    static async run(message, args) {
        if (args.length === 0) {
            return message.reply({embeds: [
                new MessageEmbed(JSON.parse(JSON.stringify(helpEmbed).replace(/{prefix}/g, DataUtils.getConfig(message.guild).prefix)))
                    .setAuthor({name: `${message.author.username}`, icon_url: message.author.displayAvatarURL()}).setTimestamp()
            ]});
        }

        const number = args[0];
        if (isNaN(number * 1)) {
            const time = args[0].split("");
            const splitTime = [];
            let current = "";
            for (let i = 0; i < time.length; i++) {
                if (isNaN(time[i])) {
                    splitTime.push({time: current, unit: time[i].toLowerCase()});
                    current = "";
                } else {
                    current = current + time[i];
                }
            }

            let total = 0;
            splitTime.forEach(({time, unit}) => {
                if (unit === "s") {
                    total += parseInt(time);
                } else if (unit === "m") {
                    total += parseInt(time) * 60;
                } else if (unit === "h") {
                    total += parseInt(time) * 60 * 60;
                } else if (unit === "d") {
                    total += parseInt(time) * 60 * 60 * 24;
                }
            });

            const target = args[1] && /<@[0-9]{16,20}>/g.test(args[1]) ? message.mentions.members.first().id : args[1] && /[0-9]{16,20}/g.test(args[1]) ? args[1] : null;

            let firstMessage = message.channel.lastMessage;
            let count = 0;
            let undeleteable = 0;
            let error = false;
            while (firstMessage.createdAt.getTime() > Date.now() - total * 1000) {
                const messages = await message.channel.messages.fetch({limit: 100, before: firstMessage.id});
                firstMessage = messages.first();
                messages.forEach((message) => {
                    if (count >= number || message.createdAt.getTime() < Date.now() - total * 1000) return;
                    if (!message.deletable) return undeleteable += 1;
                    if (target && message.author.id !== target) return;
                    message.delete().catch(() => {
                        error = true;
                    });
                    count += 1;
                });
            }

            if (target && error) {
                message.channel.send({embeds: [MessageUtils.generateErrorEmbed("Could not purge messages for member.")]}).catch(() => {});
            } else if (target) {
                message.channel.send({embeds: [MessageUtils.generateEmbed("",
                    `<:Iris_TickYes:977399754969448520> Purged **${count}** messages by <@${target.id}>.${undeleteable === 0 ? "" : ` Failed to delete **${undeleteable}** messages.`}`
                    , "#44DD66")]}).catch(() => {});
            }

            if (!target && error) {
                message.channel.send({embeds: [MessageUtils.generateErrorEmbed("Could not purge messages.")]}).catch(() => {});
            } else if (!target) {
                message.channel.send({embeds: [MessageUtils.generateEmbed("",
                    `<:Iris_TickYes:977399754969448520> Purged **${count}** messages.${undeleteable === 0 ? "" : ` Failed to delete **${undeleteable}** messages.`}`
                    , "#44DD66")]}).catch(() => {});
            }
        } else {
            if (args[1] && (/<@[0-9]{16,20}>/g.test(args[1]) || /[0-9]{16,20}/g.test(args[1]))) {
                const target = args[1] && /<@[0-9]{16,20}>/g.test(args[1]) ? message.mentions.members.first().id : args[1] && /[0-9]{16,20}/g.test(args[1]) ? args[1] : null;

                let error = false;
                let lastMessage = message.channel.lastMessageId;
                let count = 0;
                let undeleteable = 0;
                for (let i = 0; i < 10; i++) {
                    if (count >= number) break;

                    const messages = await message.channel.messages.fetch({limit: 100, before: lastMessage});
                    lastMessage = messages.first().id;
                    messages.forEach((message) => {
                        if (count >= number) return;
                        if (!message.deletable) return undeleteable += 1;
                        if (message.author.id === target) {
                            message.delete().catch(() => {
                                error = true;
                            });
                            count += 1;
                        }
                    });
                }

                if (error) {
                    message.channel.send({embeds: [MessageUtils.generateErrorEmbed("Could not purge messages for member.")]}).catch(() => {});
                } else {
                    message.channel.send({embeds: [MessageUtils.generateEmbed("",
                        `<:Iris_TickYes:977399754969448520> Purged **${count}** messages by <@${target}>.${undeleteable === 0 ? "" : ` Failed to delete **${undeleteable}** messages.`}`
                        , "#44DD66")]}).catch(() => {});
                }
            } else {
                let error = false;
                await message.channel.bulkDelete(number).catch(() => {
                    error = true;
                });
                if (error) {
                    message.channel.send({embeds: [MessageUtils.generateErrorEmbed("Could not purge messages.")]}).catch(() => {});
                } else {
                    message.channel.send({embeds: [MessageUtils.generateEmbed("",
                        `<:Iris_TickYes:977399754969448520> Purged **${parseInt(args[0])}** messages.`
                        , "#44DD66")]}).catch(() => {});
                }
            }
        }
    }
}

module.exports = Purge;
