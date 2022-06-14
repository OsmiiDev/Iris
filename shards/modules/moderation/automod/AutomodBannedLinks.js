const { Message } = require("discord.js");
const fs = require("fs");

const DataUtils = require("../../../utility/DataUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");

const AutomodRules = require("./AutomodRules");

const IrisModule = require("../../IrisModule");

class AutomodBannedLinks extends IrisModule {

    LISTENERS = [];

    constructor() {
        super("moderation.automod.AutomodBannedLinks");

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
        }
        else {
            data = JSON.parse(fs.readFileSync(`./assets/automod/${rule.rule.file.split(":")[1].endsWith(".json") ? rule.rule.file.split(":")[1] : `${rule.rule.file.split(":")[1]}.json`}`));
        }

        if (!data) { return; }

        let urls = data.links;
        let messageContent = message.content.toLowerCase();
        if (messageContent.length === 0) { return; }
        for (let url of urls) {
            let subdomains = false;
            if(url.startsWith("*.")){
                url = url.substring(2);
                subdomains = true;
            }

            let paths = false;
            if(url.endsWith("/*")){
                url = url.substring(0, url.length - 2);
                paths = true;
            }

            url = url.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

            let regex = new RegExp(`(https?:\\/\\/|\\s|^)(www\\.)?${subdomains ? "([^\\s\\/\\.]*\\.)*": ""}(${url})(\\/${paths ? "([\\S]*\\/*)*" : ""}|\\s|$)`, "gi");

            if (messageContent.match(regex)) {
                let action = rule.action;
                let actionFunction = AutomodRules.getAction(action);
                actionFunction(message, rule);
                return;
            }

        }
    }
}

module.exports = AutomodBannedLinks;