const fs = require("fs");

const DataUtils = require("../../../utility/DataUtils");

const AutomodRules = require("./AutomodRules");

const IrisModule = require("../../IrisModule");

/**
 * @description Handles banned words in messages
*/
class AutomodBannedWords extends IrisModule {
    LISTENERS = [];

    /**
     * @description Constructor
    */
    constructor() {
        super("moderation.automod.AutomodBannedWords");

        this.registerEvents();
    }

    /**
     * @description Handles message with banned words
     * @param {Message} message The message to handle
     * @param {String} rule The rule to check
    */
    static async process(message, rule) {
        let data;
        if (rule.rule.file.startsWith("custom:")) {
            data = DataUtils.read(message.guild, `moderation/automod/${rule.rule.file.split(":")[1]}`);
        } else {
            data = JSON.parse(fs.readFileSync(`./assets/automod/${rule.rule.file.split(":")[1].endsWith(".json") ? rule.rule.file.split(":")[1] : `${rule.rule.file.split(":")[1]}.json`}`));
        }

        if (!data) {
            return;
        }

        const words = data.words;
        const messageContent = message.content.toLowerCase();
        if (messageContent.length === 0) {
            return;
        }

        for (const word of words) {
            if (rule.rule.match === "exact") {
                const regex = new RegExp(`\\b${word}\\b`, "gi");
                if (messageContent.match(regex)) {
                    console.log("Automod: Banned word detected: " + word);
                    const action = rule.action;
                    const actionFunction = AutomodRules.getAction(action);
                    actionFunction(message, rule);
                    return;
                }
            } else if (rule.rule.match === "regex") {
                if (messageContent.match(new RegExp(word))) {
                    const action = rule.action;
                    const actionFunction = AutomodRules.getAction(action);
                    actionFunction(message, rule);
                    return;
                }
            }
        }
    }
}

module.exports = AutomodBannedWords;
