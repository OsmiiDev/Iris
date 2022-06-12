const { GuildMember, Guild, Collection, User } = require("discord.js");
const crypto = require("crypto");

const DataUtils = require("../../../utility/DataUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");

const ActionCase = ModuleUtils.getModule("moderation.actions.ActionCase");

const IrisModule = ModuleUtils.getModule("core.IrisModule");

class ActionMatrix extends IrisModule {

    LISTENERS = [];

    constructor() {
        super("moderation.actions.ActionMatrix");

        this.registerEvents();
    }

    /**
     * @description Checks a guild's punishment matrix and runs any actions that are met
     * @param {Guild} guild The guild to check the matrix for
     * @param {String} matrix TheID of the matrix to check
     * @param {User} user The user to check
     * @param {String} action The type of action that has just been performed
    */
    static async handleMatrix(guild, matrix, user, action) {
        let rules = DataUtils.getConfig(guild).modules.moderation.actions.matrix.matricies[matrix];
        if (!rules) { return []; }

        rules = rules.rules;

        for (let rule of rules) {
            let on = ActionMatrix.parseRule(rule.on);
            let run = ActionMatrix.parseRun(rule.run);

            if (action === "autowarn" && on("autowarn", guild.getActionHistory(user, "autowarns"))) {
                run(guild, user)
            }

            if (action === "warn" && on("warn", guild.getActionHistory(user, "warns"))) {
                run(guild, user);
            }

            if (action === "mute" && on("mute", guild.getActionHistory(user, "mutes"))) {
                run(guild, user);
            }
        }
    }

    /**
     * @description Parses a rule into a function
     * @param {String} rule The rule in the matrix rule format
     * @returns {function} A function that returns true if the rule is met
    */
    static parseRule(rule) {
        let [action, compare, value, , window] = rule.split(" ");

        return (act, history) => {
            if (action !== act) { return; }
            let count = history.reduce((previous, current) => {
                if (current.start + window > Math.floor(new Date().getTime() / 1000)) {
                    return previous + 1;
                }
            }, 0);

            if (compare.includes(">") && count > value * 1) { return true; }
            if (compare.includes("<") && count < value * 1) { return true; }
            if (compare.includes("=") && count === value * 1) { return true; }
            if (compare.includes("!") && count !== value * 1) { return true; }
            if (compare.includes("%") && count % value * 1 === 0) { return true; }
            return false;
        };
    }

    /**
     * @description Runs the specified action
     * @param {String} run The action to run
     * @returns {function} A function that runs the action given a guild and user
    */
    static parseRun(run) {
        let [action, time, matrix] = run.split(" ");
        
        if (action === "mute") {
            return async (guild, user) => {
                let member = await guild.members.fetch(user.id).catch(() => { });
                if (!(member instanceof GuildMember)) { return; }

                if (time === "default") { time = ModuleUtils.getModule("moderation.actions.ActionMute").getDefaultTime(member); }
                if (time === "permanent") { time = 0; }

                ModuleUtils.getModule("moderation.actions.ActionMute").createMute(member, time === "permanent" ? 0 : time, "Punishment threshold reached");
                ActionCase.createCase(guild, "MUTE_CREATE", `${user.id}:${crypto.randomUUID()}`, member, guild.me, "Punishment threshold reached", time);
            };
        }
        if (action === "ban") {
            return async (guild, user) => {
                ModuleUtils.getModule("moderation.actions.ActionBan").createBan(guild, user.id, time === "permanent" ? 0 : time, "Punishment threshold reached");
                ActionCase.createCase(guild, "BAN_CREATE", `${user.id}:${crypto.randomUUID()}`, user, guild.me, "Punishment threshold reached", time === "permanent" ? 0 : time);
            };
        }
        if (action === "kick") {
            return async (guild, user) => {
                let member = await guild.members.fetch(user.id).catch(() => { });
                if (!(member instanceof GuildMember)) { return; }

                ModuleUtils.getModule("moderation.actions.ActionKick").createKick(member, "Punishment threshold reached");
                ActionCase.createCase(guild, "KICK_CREATE", `${user.id}:${crypto.randomUUID()}`, user, guild.me, "Punishment threshold reached");
            };
        }
    }
}

module.exports = ActionMatrix;