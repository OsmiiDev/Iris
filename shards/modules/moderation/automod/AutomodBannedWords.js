const { Message } = require("discord.js");
const fs = require("fs");

const DataUtils = require("../../../utility/DataUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");

const AutomodRules = require("./AutomodRules");

const IrisModule = require("../../IrisModule");

class AutomodBannedWords extends IrisModule {

    LISTENERS = [];

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
        if (rule.exempt.channels.includes(message.channel.id)) { return; }
        if (rule.exempt.users.includes(message.author.id)) { return; }
        if (rule.exempt.roles.some(role => message.member.roles.cache.has(role))) { return; }

        let data;
        if (rule.rule.file.startsWith("custom:")) {
            data = DataUtils.read(guild, `moderation/automod/${rule.rule.file.split(":")[1]}`);
        }
        else {
            data = JSON.parse(fs.readFileSync(`./assets/automod/${rule.rule.file.split(":")[1].endsWith(".json") ? rule.rule.file.split(":")[1] : `${rule.rule.file.split(":")[1]}.json`}`));
        }

        if (!data) { return; }

        let words = data.words;
        let messageContent = message.content.toLowerCase();
        if (messageContent.length === 0) { return; }

        for (let word of words) {
            if (rule.rule.match === "exact") {
                let regex = new RegExp(`\\b${word}\\b`, "gi");
                if (messageContent.match(regex)) {
                    console.log("Automod: Banned word detected: " + word);
                    let action = rule.action;
                    let actionFunction = AutomodRules.getAction(action);
                    actionFunction(message, rule.name);
                    return;
                }
            }
            else if (rule.rule.match === "regex") {
                if (messageContent.match(new RegExp(word))) {
                    let action = rule.action;
                    let actionFunction = AutomodRules.getAction(action);
                    actionFunction(message, rule.name);
                    return;
                }
            }
        }
    }

    

}

module.exports = AutomodBannedWords;