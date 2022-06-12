const { Message } = require("discord.js");
const crypto = require("crypto");
const fs = require("fs");

const DataUtils = require("../../../utility/DataUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");
const MessageUtils = require("../../../utility/MessageUtils");

const ActionBan = require("../actions/ActionBan");
const ActionCase = require("../actions/ActionCase");
const ActionMute = require("../actions/ActionMute")
const ActionWarnModals = require("../actions/ActionWarnModals");

const IrisModule = require("../../IrisModule");

class AutomodASCIIArt extends IrisModule {

    LISTENERS = [
        { event: "messageCreate", function: this.messageCreate }
    ];

    constructor() {
        super("moderation.automod.AutomodASCIIArt");

        this.registerEvents();
    }


    /**
     * @description Handles message with banned words
     * @param {Message} message The message to handle
    */
    async messageCreate(message) {
        if (!message.inGuild()) { return; }
        if (message.author.bot || message.author.system) { return; }

        let guild = message.guild;
        let automod = DataUtils.getConfig(guild).modules.moderation.automod;

        if (!automod.enabled) { return; }
        for (let rule of automod.rules) {
            if (rule.rule.type !== "banned-words") { continue; }
            if (!rule.enabled) { continue; }

            let data;
            if (rule.rule.file.startsWith("custom:")) {
                data = DataUtils.read(guild, `moderation/automod/${rule.rule.file.split(":")[1]}`);
            }
            else {
                data = JSON.parse(fs.readFileSync(`./assets/automod/${rule.rule.file.split(":")[1].endsWith(".json") ? rule.rule.file.split(":")[1] : `${rule.rule.file.split(":")[1]}.json`}`));
            }
            if (!data) { continue; }

            let words = data.words;
            let messageContent = message.content.toLowerCase();
            if (messageContent.length === 0) { continue; }

            if (rule.exempt.channels.includes(message.channel.id)) { continue; }
            if (rule.exempt.users.includes(message.author.id)) { continue; }
            if (rule.exempt.roles.some(role => message.member.roles.cache.has(role))) { continue; }

            for (let word of words) {
                if (rule.rule.match === "exact") {
                    let regex = new RegExp(`\\b${word}\\b`, "gi");
                    if (messageContent.match(regex)) {
                        console.log("Automod: Banned word detected: " + word);
                        let action = rule.action;
                        let actionFunction = AutomodBannedWords.getAction(action);
                        actionFunction(message, rule.name);
                        return;
                    }
                }
                else if (rule.rule.match === "regex") {
                    if (messageContent.match(new RegExp(word))) {
                        let action = rule.action;
                        let actionFunction = AutomodBannedWords.getAction(action);
                        actionFunction(message, rule.name);
                        return;
                    }
                }
            }
        }
    }

    /**
     * @description Processes an action
     * @param {String} action The action to process
     * @returns {Function} The function to execute
    */
    static getAction(action) {
        let actions = action.split(";");

        return (message, rule) => {
            actions.forEach(async (action) => {
                action = action.trim();
                if (action.startsWith("delete")) {
                    message.delete();
                }

                if (action.startsWith("ban")) {
                    let time = action.split(" ")[1];
                    if (time === "permanent") {
                        ActionBan.createBan(message.guild, message.author.id, 0, `Automod - Violated rule ${rule}`);
                        ActionCase.createCase(message.guild, "BAN_CREATE", crypto.randomUUID(), message.author, message.guild.me, `Automod - Violated rule ${rule}`, 0);
                    }
                    else if (time === "default") {
                        let time = ActionBan.getDefaultTime(message.guild, message.author.id);
                        ActionBan.createBan(message.guild, message.author.id, time, `Automod - Violated rule ${rule}`);
                        ActionCase.createCase(message.guild, "BAN_CREATE", crypto.randomUUID(), message.author, message.guild.me, `Automod - Policy violation: ${rule}`, time);
                    }
                }

                if (action.startsWith("mute")) {
                    let time = action.split(" ")[1];
                    if (time === "permanent") {
                        ActionMute.createMute(message.member, 0, `Automod - Violated rule ${rule}`);
                        ActionCase.createCase(message.guild, "MUTE_CREATE", crypto.randomUUID(), message.member, message.guild.me, `Automod - Policy violation: ${rule}`, 0);
                    }
                    else if (time === "default") {
                        time = ActionMute.getDefaultTime(message.member, message.member);
                        ActionMute.createMute(message.member, time, `Automod - Violated rule ${rule}`);
                        ActionCase.createCase(message.guild, "MUTE_CREATE", crypto.randomUUID(), message.member, message.guild.me, `Automod - Policy violation: ${rule}`, time);
                    }
                }

                if (action.startsWith("warn")) {
                    let warning = action.split(" ").slice(1).join(" ")
                        .replace("{User}", message.author.id);

                    let embed = MessageUtils.generateEmbed("", `${warning}`, "#BB2244");

                    let warningMessage = await message.channel.send({ embeds: [embed] });
                    setTimeout(() => { warningMessage.delete(); }, 5000);

                    ActionWarnModals.createAutomodWarn(message.member, `Automod - Violated rule ${rule}`);
                }
            })
        };
    }

}

module.exports = AutomodASCIIArt;