const {Guild, GuildMember} = require("discord.js");
const crypto = require("crypto");

const DataUtils = require("../../../utility/DataUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");
const MessageUtils = require("../../../utility/MessageUtils");

const ActionBan = require("../actions/ActionBan");
const ActionCase = require("../actions/ActionCase");
const ActionMute = require("../actions/ActionMute");
const ActionWarnModals = require("../actions/ActionWarnModals");

const IrisModule = require("../../IrisModule");
const PermissionUtils = require("../../../utility/PermissionUtils");

/**
 * @description Checks a guild's automod rules and runs any actions that are met
*/
class AutomodRules extends IrisModule {
    LISTENERS = [
        {event: "messageCreate", function: this.messageCreate},
        {event: "messageUpdate", function: this.messageUpdate}
    ];

    /**
     * @description Constructor
    */
    constructor() {
        super("moderation.automod.AutomodRules");

        this.registerEvents();
    }

    /**
     * @description Handles messages
     * @param {Message} oldMessage The old message, unused
     * @param {Message} message The new message
    */
    async messageUpdate(oldMessage, message) {
        if (!message.inGuild() || !(message.member instanceof GuildMember) || !message.channel) {
            return;
        }
        if (message.author.bot || message.author.system) {
            return;
        }

        const guild = message.guild;
        const automod = DataUtils.getConfig(guild).modules.moderation.automod;

        if (!automod.enabled) {
            return;
        }

        automod.rules.forEach(async (rule) => {
            if (!rule.enabled) {
                return;
            }
            if (rule.exempt.channels.includes(message.channel.id)) {
                return;
            }
            if (rule.exempt.users.includes(message.author.id)) {
                return;
            }
            if (rule.exempt.roles.some((role) => message.member.roles.cache.has(role))) {
                return;
            }

            if (rule.rule.type === "banned-words") {
                ModuleUtils.getModule("moderation.automod.AutomodBannedWords").process(message, rule);
            }
            if (rule.rule.type === "banned-links") {
                ModuleUtils.getModule("moderation.automod.AutomodBannedLinks").process(message, rule);
            }
            if (rule.rule.type === "rate-limit") {
                ModuleUtils.getModule("moderation.automod.AutomodRateLimits").process(message, rule);
            }
        });
    }

    /**
     * @description Handles messages
     * @param {Message} message The message to handle
    */
    async messageCreate(message) {
        if (!message.inGuild() || !(message.member instanceof GuildMember) || !message.channel) {
            return;
        }
        if (message.author.bot || message.author.system) {
            return;
        }

        const guild = message.guild;
        const automod = DataUtils.getConfig(guild).modules.moderation.automod;

        if (!automod.enabled) {
            return;
        }

        automod.rules.forEach(async (rule) => {
            if (!rule.enabled) {
                return;
            }
            if (rule.exempt.channels.includes(message.channel.id)) {
                return;
            }
            if (rule.exempt.users.includes(message.author.id)) {
                return;
            }
            if (rule.exempt.roles.some((role) => message.member.roles.cache.has(role))) {
                return;
            }

            if (rule.rule.type === "banned-words") {
                ModuleUtils.getModule("moderation.automod.AutomodBannedWords").process(message, rule);
            }
            if (rule.rule.type === "banned-links") {
                ModuleUtils.getModule("moderation.automod.AutomodBannedLinks").process(message, rule);
            }
            if (rule.rule.type === "rate-limit") {
                ModuleUtils.getModule("moderation.automod.AutomodRateLimits").process(message, rule);
            }
        });
    }

    /**
     * @description Processes an action
     * @param {String} action The action to process
     * @return {Function} The function to execute
    */
    static getAction(action) {
        const actions = action.split(";");

        return (message, rule) => {
            actions.forEach(async (action) => {
                action = action.trim();
                if (action.startsWith("delete")) {
                    message.delete();
                }

                if (action.startsWith("ban")) {
                    const time = action.split(" ")[1];
                    if (message.guild instanceof Guild && PermissionUtils.botPermission(message.guild, PermissionUtils.PermissionGroups.MODERATION_BASIC)) {
                        if ((message.member instanceof GuildMember && message.member.bannable) || !(message.member instanceof GuildMember)) {
                            if (time === "permanent") {
                                ActionBan.createBan(message.guild, message.author.id, 0, `Automod - Violated rule ${rule.name}`);
                                ActionCase.createCase(message.guild, "BAN_CREATE", crypto.randomUUID(), message.author, message.guild.me, `Automod - Violated rule ${rule.name}`, 0);
                            } else if (time === "default") {
                                const time = ActionBan.getDefaultTime(message.guild, message.author.id);
                                ActionBan.createBan(message.guild, message.author.id, time, `Automod - Violated rule ${rule.name}`);
                                ActionCase.createCase(message.guild, "BAN_CREATE", crypto.randomUUID(), message.author, message.guild.me, `Automod - Policy violation: ${rule.name}`, time);
                            }
                        }
                    }
                }

                if (action.startsWith("mute")) {
                    let time = action.split(" ")[1];
                    if (message.guild instanceof Guild && PermissionUtils.botPermission(message.guild, PermissionUtils.PermissionGroups.MODERATION_BASIC)) {
                        if (message.member instanceof GuildMember && message.member.moderateable) {
                            if (time === "permanent") {
                                ActionMute.createMute(message.member, 0, `Automod - Violated rule ${rule.name}`);
                                ActionCase.createCase(message.guild, "MUTE_CREATE", crypto.randomUUID(), message.member, message.guild.me, `Automod - Policy violation: ${rule.name}`, 0);
                            } else if (time === "default") {
                                time = ActionMute.getDefaultTime(message.member, message.member);
                                ActionMute.createMute(message.member, time, `Automod - Violated rule: ${rule.name}`);
                                ActionCase.createCase(message.guild, "MUTE_CREATE", crypto.randomUUID(), message.member, message.guild.me, `Automod - Violated rule: ${rule.name}`, time);
                            }
                        }
                    }
                }

                if (action.startsWith("warn")) {
                    const warning = action.split(" ").slice(1).join(" ")
                        .replace("{User}", message.author.id);

                    const embed = MessageUtils.generateEmbed("", `${warning}`, "#BB2244");

                    const warningMessage = await message.channel.send({embeds: [embed]});
                    setTimeout(() => {
                        warningMessage.delete();
                    }, 5000);

                    ActionWarnModals.createAutomodWarn(message.member, `Automod - Violated rule: ${rule.name}`, rule.matrix);
                    ActionCase.createCase(message.guild, "AUTOWARN_CREATE", crypto.randomUUID(), message.member, message.guild.me, `Automod - Violated rule: ${rule.name}`, 0);
                }
            });
        };
    }
}

module.exports = AutomodRules;
