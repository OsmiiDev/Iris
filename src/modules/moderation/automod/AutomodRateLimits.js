const IrisModule = require("../../IrisModule");
const AutomodRules = require("./AutomodRules");

const messages = {};

/**
 * @description Handles spam
 */
class AutomodRateLimits extends IrisModule {
    LISTENERS = [];

    /**
     * @description Constructor
    */
    constructor() {
        super("moderation.automod.AutomodRateLimits");

        this.registerEvents();
    }

    /**
     * @description Handles spam messages
     * @param {Message} message The message to handle
     * @param {String} rule The rule to check
    */
    static async process(message, rule) {
        if (!messages[message.guild.id]) {
            messages[message.guild.id] = {};
        }
        if (!messages[message.guild.id][message.author.id]) {
            messages[message.guild.id][message.author.id] = [];
        }

        while (messages[message.guild.id][message.author.id].length > 0 && messages[message.guild.id][message.author.id][0].time < new Date().getTime() - rule.rule.window) {
            messages[message.guild.id][message.author.id].shift();
        }

        messages[message.guild.id][message.author.id].push({id: message.id, channel: message.channel.id, time: new Date().getTime()});

        if (messages[message.guild.id][message.author.id].length >= rule.rule.number) {
            const action = rule.action;
            const actionFunction = AutomodRules.getAction(action);
            actionFunction(message, rule);
            if (action.split(";").includes("delete")) {
                messages[message.guild.id][message.author.id].forEach((msg) => {
                    message.guild.channels.cache.get(msg.channel).messages.fetch(msg.id).catch(() => { }).then((msg) => {
                        if (msg && msg.deleteable) {
                            msg.delete().catch(() => { });
                        }
                    });
                });
                messages[message.guild.id][message.author.id] = [];
            }

            return;
        }
    }
}

module.exports = AutomodRateLimits;
