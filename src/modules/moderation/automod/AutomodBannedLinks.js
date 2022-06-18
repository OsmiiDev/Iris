const fs = require("fs");

const DataUtils = require("../../../utility/DataUtils");
const AutomodRules = require("./AutomodRules");

const IrisModule = require("../../IrisModule");

/**
 * @description Handles link blacklists
*/
class AutomodBannedLinks extends IrisModule {
    LISTENERS = [];

    /**
     * @description Constructor
    */
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
        if (rule.rule.any) {
            // eslint-disable-next-line no-useless-escape
            if (/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/.test(message.content)) {
                const action = rule.action;
                const actionFunction = AutomodRules.getAction(action);
                actionFunction(message, rule);
                return;
            }
            return;
        }

        if (rule.rule.file.startsWith("custom:")) {
            data = DataUtils.read(message.guild, `moderation/automod/${rule.rule.file.split(":")[1]}`);
        } else {
            data = JSON.parse(fs.readFileSync(`./assets/automod/${rule.rule.file.split(":")[1].endsWith(".json") ? rule.rule.file.split(":")[1] : `${rule.rule.file.split(":")[1]}.json`}`));
        }

        if (!data) {
            return;
        }

        const urls = data.links;
        const messageContent = message.content.toLowerCase();
        if (messageContent.length === 0) {
            return;
        }
        for (let url of urls) {
            let subdomains = false;
            if (url.startsWith("*.")) {
                url = url.substring(2);
                subdomains = true;
            }

            let paths = false;
            if (url.endsWith("/*")) {
                url = url.substring(0, url.length - 2);
                paths = true;
            }

            // eslint-disable-next-line no-useless-escape
            url = url.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

            const regex = new RegExp(`(https?:\\/\\/|\\s|^)(www\\.)?${subdomains ? "([^\\s\\/\\.]*\\.)*" : ""}(${url})(\\/${paths ? "([\\S]*\\/*)*" : ""}|\\s|$)`, "gi");

            if (regex.test(messageContent)) {
                const action = rule.action;
                const actionFunction = AutomodRules.getAction(action);
                actionFunction(message, rule);
                return;
            }
        }
    }
}

module.exports = AutomodBannedLinks;
