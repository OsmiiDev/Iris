const IrisModule = require("../../IrisModule");
const AutomodRules = require("./AutomodRules");

/**
 * @description Detects Zalgo in messages
*/
class AutomodZalgo extends IrisModule {
    /**
     * @description Constructor
    */
    constructor() {
        super("moderation.automod.AutomodZalgo");

        this.registerEvents();
    }

    /**
     * @description Handles messages with Zalgo
     * @param {Message} message The message to handle
     * @param {String} rule The rule to check
    */
    static async process(message, rule) {
        const zalgo = new RegExp(`[\\s\\S][\\u0300}-\\u036f]{${rule.rule.threshold},}`, "g");

        if (rule.rule.count.endsWith("%")) {
            rule.rule.count = message.content.length * rule.rule.count.replace("%", "") / 100;
        }

        if (message.content.match(zalgo) && message.content.match(zalgo).length >= rule.rule.count) {
            const action = rule.action;
            const actionFunction = AutomodRules.getAction(action);
            actionFunction(message, rule);
        }

        /[\s\S][\u0300-\u036f]{3,}/g;
    }
}

module.exports = AutomodZalgo;
