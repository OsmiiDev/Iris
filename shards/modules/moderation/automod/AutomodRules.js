const { Message, GuildMember } = require("discord.js");
const crypto = require("crypto");

const DataUtils = require("../../../utility/DataUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");
const MessageUtils = require("../../../utility/MessageUtils");

const ActionBan = require("../actions/ActionBan");
const ActionCase = require("../actions/ActionCase");
const ActionMute = require("../actions/ActionMute");
const ActionWarnModals = require("../actions/ActionWarnModals");

const IrisModule = require("../../IrisModule");

class AutomodRules extends IrisModule {

    LISTENERS = [
        { event: "messageCreate", function: this.messageCreate }
    ];

    constructor() {
        super("moderation.automod.AutomodRules");

        this.registerEvents();
    }

    /**
     * @description Handles message with banned words
     * @param {Message} message The message to handle
    */
    async messageCreate(message) {
        if (!message.inGuild() || !(message.member instanceof GuildMember) || !message.channel) { return; }
        if (message.author.bot || message.author.system) { return; }

        let guild = message.guild;
        let automod = DataUtils.getConfig(guild).modules.moderation.automod;

        if (!automod.enabled) { return; }

        automod.rules.forEach(async (rule) => {
            if (!rule.enabled) { return; }
            if (rule.exempt.channels.includes(message.channel.id)) { return; }
            if (rule.exempt.users.includes(message.author.id)) { return; }
            if (rule.exempt.roles.some(role => message.member.roles.cache.has(role))) { return; }

            if (rule.rule.type === "banned-words") { ModuleUtils.getModule("moderation.automod.AutomodBannedWords").process(message, rule); }
            if (rule.rule.type === "banned-links") { ModuleUtils.getModule("moderation.automod.AutomodBannedLinks").process(message, rule); }
            if (rule.rule.type === "rate-limit") { ModuleUtils.getModule("moderation.automod.AutomodRateLimits").process(message, rule); }
        })
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
                        ActionBan.createBan(message.guild, message.author.id, 0, `Automod - Violated rule ${rule.name}`);
                        ActionCase.createCase(message.guild, "BAN_CREATE", crypto.randomUUID(), message.author, message.guild.me, `Automod - Violated rule ${rule.name}`, 0);
                    }
                    else if (time === "default") {
                        let time = ActionBan.getDefaultTime(message.guild, message.author.id);
                        ActionBan.createBan(message.guild, message.author.id, time, `Automod - Violated rule ${rule.name}`);
                        ActionCase.createCase(message.guild, "BAN_CREATE", crypto.randomUUID(), message.author, message.guild.me, `Automod - Policy violation: ${rule.name}`, time);
                    }
                }

                if (action.startsWith("mute")) {
                    let time = action.split(" ")[1];
                    if (time === "permanent") {
                        ActionMute.createMute(message.member, 0, `Automod - Violated rule ${rule.name}`);
                        ActionCase.createCase(message.guild, "MUTE_CREATE", crypto.randomUUID(), message.member, message.guild.me, `Automod - Policy violation: ${rule.name}`, 0);
                    }
                    else if (time === "default") {
                        time = ActionMute.getDefaultTime(message.member, message.member);
                        ActionMute.createMute(message.member, time, `Automod - Violated rule: ${rule.name}`);
                        ActionCase.createCase(message.guild, "MUTE_CREATE", crypto.randomUUID(), message.member, message.guild.me, `Automod - Violated rule: ${rule.name}`, time);
                    }
                }

                if (action.startsWith("warn")) {
                    let warning = action.split(" ").slice(1).join(" ")
                        .replace("{User}", message.author.id);

                    let embed = MessageUtils.generateEmbed("", `${warning}`, "#BB2244");

                    let warningMessage = await message.channel.send({ embeds: [embed] });
                    setTimeout(() => { warningMessage.delete(); }, 5000);

                    console.log(rule.matrix);
                    ActionWarnModals.createAutomodWarn(message.member, `Automod - Violated rule: ${rule.name}`, rule.matrix);
                    ActionCase.createCase("AUTOWARN_CREATE", crypto.randomUUID(), message.author, message.guild.me, `Automod - Violated rule: ${rule.name}`, 0);
                }
            })
        };
    }
}

module.exports = AutomodRules;