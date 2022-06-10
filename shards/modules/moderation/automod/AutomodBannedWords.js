const { Message } = require("discord.js");
const crypto = require("crypto");
const fs = require("fs");

const DataUtils = require("../../../utility/DataUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");

const ActionBan = ModuleUtils.getModule("moderation.actions.ActionBan");
const ActionCase = ModuleUtils.getModule("moderation.actions.ActionCase");
const ActionMute = ModuleUtils.getModule("moderation.actions.ActionMute");

const IrisModule = ModuleUtils.getModule("core.IrisModule");


class AutomodBannedWords extends IrisModule {

    LISTENERS = [
        { event: "messageCreate", function: this.messageCreate }
    ];

    constructor() {
        super("moderation.automod.AutomodBannedWords");

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

            let data = DataUtils.read(guild, rule.rule.file);
            if (!data) { continue; }

            let words = data.words;
            let messageContent = message.content.toLowerCase();

            for (let word of words) {
                if (messageContent.includes(word)) {
                    console.log("Automod: Banned word detected");
                    let action = rule.action;
                    let actionFunction = AutomodBannedWords.getAction(action);
                    actionFunction(message, rule.name);
                    return;
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
            actions.forEach((action) => {
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
            })
        };
    }

}

module.exports = AutomodBannedWords;