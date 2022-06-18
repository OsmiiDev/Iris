const {Message} = require("discord.js");
const IrisModule = require("../../IrisModule");
const AutomodRules = require("./AutomodRules");

/**
 * @description Handles spam
*/
class AutomodSpam extends IrisModule {
    /**
     * @description Constructor
    */
    constructor() {
        super("moderation.automod.AutomodSpam");

        this.registerEvents();
    }

    /**
     * @description Handles message with spam
     * @param {Message} message The message to handle
     * @param {String} rule The rule to check
    */
    static async process(message, rule) {
        const filter = AutomodSpam.processFilter(rule.rule.filter);
        if (filter(message) === true) {
            const action = rule.action;
            const actionFunction = AutomodRules.getAction(action);
            actionFunction(message, rule);
            return;
        }
    }

    /**
     * @description Processes a filter and returns a function that can be used to check if a message is spam
     * @param {String} filter The filter to process
     * @return {Function} A function that can be used to check if a message is spam
    */
    static processFilter(filter) {
        return ((message) => {
            if (!(message instanceof Message)) return false;

            filter = filter.replace(/{[^{}]*}/g, (match) => {
                match = match.substring(1, match.length - 1);
                let [key, comparator, value] = match.split(" ");
                let count = 0;
                console.log(message.content.match(/<a?:[\\S]+:[0-9]{16,20}>/g));

                if (key === "emojis") count += message.content.match(/<a?:[\S]+:[0-9]{16,20}>/g) ? message.content.match(/<a?:[\S]+:[0-9]{16,20}>/g).length : 0;
                if (key === "mentions-users") count += message.mentions.users.size;
                if (key === "mentions-roles") count += message.mentions.roles.size;
                if (key === "mentions-channels") count += message.mentions.channels.size;
                if (key === "mentions-everyone") count += message.mentions.everyone ? 1 : 0;
                if (key === "mentions") count += message.mentions.users.size + message.mentions.roles.size + message.mentions.channels.size + (message.mentions.everyone ? 1 : 0);
                if (key === "attachments") count += message.attachments.size;
                if (key === "embeds") count += message.embeds.size;
                if (key === "stickers") count += message.stickers.size;

                let matches = false;
                if (value.endsWith("%")) value = message.content.length * value.replace("%", "") / 100;
                if (comparator.includes(">") && count > value) matches = true;
                if (comparator.includes("<") && count < value) matches = true;
                if (comparator.includes("=") && count === value) matches = true;
                if (comparator.includes("!") && count !== value) matches = true;

                return matches;
            });

            console.log(filter);
            while (/{[^{}]*}/g.test(filter)) {
                filter = filter.replace(/{[^{}]*}/g, (match) => {
                    match = match.substring(1, match.length - 1).split(" ");

                    const initial = match[0];
                    if (!initial) return false;

                    console.log(match);
                    let orTrue = false;
                    let andTrue = true;

                    match = match.slice(1).chunk(2);
                    match.forEach(([operator, value]) => {
                        if (operator === "|" && value === "true") orTrue = true;
                        if (operator === "&" && value === "false") andTrue = false;
                    });

                    if (orTrue && andTrue) return true;
                    else return false;
                });
            }

            return filter === "true" || filter === true;
        });
    }
}

module.exports = AutomodSpam;
