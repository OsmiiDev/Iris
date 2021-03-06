const {Guild, TextChannel} = require("discord.js");

const DataUtils = require("../../../utility/DataUtils");
const MessageUtils = require("../../../utility/MessageUtils");

const IrisModule = require("../../IrisModule");

/**
 * @description HAndles the creation of moderation cases
*/
class ActionCase extends IrisModule {
    LISTENERS = [];

    /**
     * @description Constructor
    */
    constructor() {
        super("moderation.actions.ActionCase");

        this.registerEvents();
    }

    /**
     * @param {Guild} guild
     * @param {('MUTE_CREATE'|'MUTE_DELETE'|'WARN_CREATE'|'BAN_CREATE'|'BAN_DELETE')} action
     * @param  {...any} data
    */
    static async createCase(guild, action, ...data) {
        if (!(guild instanceof Guild)) {
            guild = process.client.guilds.fetch(guild);
        }
        if (!(guild instanceof Guild)) {
            return;
        }

        if (!guild.me.permissions.has("ADMINISTRATOR")) {
            return;
        }

        const caseData = DataUtils.read(guild, "moderation/actions/cases");

        if (action === "BAN_CREATE") {
            const [id, user, moderator, reason, time] = data;
            const caseEmbed = MessageUtils.generateEmbed(`Case #${caseData.cases.length} | Ban | ${user.tag}`, "", "#BB4466", moderator.user)
                .addField("User", `<@${user.id}>`, true)
                .addField("Moderator", `<@${moderator.id}>`, true)
                .addField("Reason", reason, true)
                .setFooter({text: `ID: ${id || "No ID"}`}).setTimestamp();

            if (time === 0) {
                caseEmbed.addField("Time", "Permanent", true);
            } else {
                caseEmbed.addField("Time", DataUtils.parseTimeToString(time), true);
            }

            const channel = await guild.channels.fetch(DataUtils.getConfig(guild).modules.moderation.actions.ban["log-channel"]);
            if (!(channel instanceof TextChannel)) {
                return;
            }

            channel.send({embeds: [caseEmbed]});

            caseData.cases.push({
                "type": "BAN_CREATE",
                "id": id,
                "member": user.id,
                "moderator": moderator.id,
                "reason": reason,
                "timestamp": Math.floor(new Date().getTime() / 1000),
                "length": time
            });

            DataUtils.write(guild, "moderation/actions/cases", caseData);
        }
        if (action === "BAN_DELETE") {
            const [id, user, moderator, reason] = data;
            const caseEmbed = MessageUtils.generateEmbed(`Case #${caseData.cases.length} | Unban | ${user.tag}`, "", "#889944", moderator.user)
                .addField("User", `<@${user.id}>`, true)
                .addField("Moderator", `<@${moderator.id}>`, true)
                .addField("Reason", reason, true)
                .setFooter({text: `ID: ${id || "No ID | User is not banned"}`}).setTimestamp();

            const channel = await guild.channels.fetch(DataUtils.getConfig(guild).modules.moderation.actions.ban["log-channel"]);
            if (!(channel instanceof TextChannel)) {
                return;
            }

            channel.send({embeds: [caseEmbed]});

            caseData.cases.push({
                "type": "BAN_DELETE",
                "id": id,
                "member": user.id,
                "moderator": moderator.id,
                "reason": reason,
                "timestamp": Math.floor(new Date().getTime() / 1000)
            });

            DataUtils.write(guild, "moderation/actions/cases", caseData);
        }
        if (action === "MUTE_CREATE") {
            const [id, member, moderator, reason, time] = data;
            const caseEmbed = MessageUtils.generateEmbed(`Case #${caseData.cases.length} | Mute | ${member.user.tag}`, "", "#BB4466", moderator.user)
                .addField("User", `<@${member.id}>`, true)
                .addField("Moderator", `<@${moderator.id}>`, true)
                .addField("Reason", reason, true)
                .setFooter({text: `ID: ${id || "No ID"}`}).setTimestamp();

            if (time === 0) {
                caseEmbed.addField("Time", "Permanent", true);
            } else {
                caseEmbed.addField("Time", DataUtils.parseTimeToString(time), true);
            }

            const channel = await guild.channels.fetch(DataUtils.getConfig(guild).modules.moderation.actions.mute["log-channel"]);
            if (!(channel instanceof TextChannel)) {
                return;
            }

            channel.send({embeds: [caseEmbed]});

            caseData.cases.push({
                "type": "MUTE_CREATE",
                "id": id,
                "member": member.id,
                "moderator": moderator.id,
                "reason": reason,
                "timestamp": Math.floor(new Date().getTime() / 1000),
                "length": time
            });

            DataUtils.write(guild, "moderation/actions/cases", caseData);
        }
        if (action === "MUTE_DELETE") {
            const [id, member, moderator, reason] = data;
            const caseEmbed = MessageUtils.generateEmbed(`Case #${caseData.cases.length} | Unmute | ${member.user.tag}`, "", "#889944", moderator.user)
                .addField("User", `<@${member.id}>`, true)
                .addField("Moderator", `<@${moderator.id}>`, true)
                .addField("Reason", reason, true)
                .setFooter({text: `ID: ${id || "No ID | User is not muted"}`}).setTimestamp();

            const channel = await guild.channels.fetch(DataUtils.getConfig(guild).modules.moderation.actions.mute["log-channel"]);
            if (!(channel instanceof TextChannel)) {
                return;
            }

            channel.send({embeds: [caseEmbed]});

            caseData.cases.push({
                "type": "MUTE_DELETE",
                "id": id,
                "member": member.id,
                "moderator": moderator.id,
                "reason": reason,
                "timestamp": Math.floor(new Date().getTime() / 1000)
            });

            DataUtils.write(guild, "moderation/actions/cases", caseData);
        }
        if (action === "WARN_CREATE") {
            const [id, member, moderator, reason] = data;
            const caseEmbed = MessageUtils.generateEmbed(`Case #${caseData.cases.length} | Warn | ${member.user.tag}`, "", "#BB4466", moderator.user)
                .addField("User", `<@${member.id}>`, true)
                .addField("Moderator", `<@${moderator.id}>`, true)
                .addField("Reason", reason, true)
                .setFooter({text: `ID: ${id || "No ID"}`}).setTimestamp();

            const channel = await guild.channels.fetch(DataUtils.getConfig(guild).modules.moderation.actions.warn["log-channel"]);
            if (!(channel instanceof TextChannel)) {
                return;
            }

            channel.send({embeds: [caseEmbed]});

            caseData.cases.push({
                "type": "WARN_CREATE",
                "id": id,
                "member": member.id,
                "moderator": moderator.id,
                "reason": reason,
                "timestamp": Math.floor(new Date().getTime() / 1000)
            });

            DataUtils.write(guild, "moderation/actions/cases", caseData);
        }
        if (action === "AUTOWARN_CREATE") {
            const [id, member, moderator, reason] = data;
            const caseEmbed = MessageUtils.generateEmbed(`Case #${caseData.cases.length} | Automod Warn | ${member.user.tag}`, "", "#BB4466", moderator.user)
                .addField("User", `<@${member.id}>`, true)
                .addField("Moderator", `<@${moderator.id}>`, true)
                .addField("Reason", reason, true)
                .setFooter({text: `ID: ${id || "No ID"}`}).setTimestamp();

            const channel = await guild.channels.fetch(DataUtils.getConfig(guild).modules.moderation.actions.warn["log-channel"]);
            if (!(channel instanceof TextChannel)) {
                return;
            }

            channel.send({embeds: [caseEmbed]});

            caseData.cases.push({
                "type": "AUTOWARN_CREATE",
                "id": id,
                "member": member.id,
                "moderator": moderator.id,
                "reason": reason,
                "timestamp": Math.floor(new Date().getTime() / 1000)
            });

            DataUtils.write(guild, "moderation/actions/cases", caseData);
        }
        if (action === "KICK_CREATE") {
            const [id, user, moderator, reason] = data;
            const caseEmbed = MessageUtils.generateEmbed(`Case #${caseData.cases.length} | Kick | ${user.tag}`, "", "#BB4466", moderator.user)
                .addField("User", `<@${user.id}>`, true)
                .addField("Moderator", `<@${moderator.id}>`, true)
                .addField("Reason", reason, true)
                .setFooter({text: `ID: ${id || "No ID"}`}).setTimestamp();

            const channel = await guild.channels.fetch(DataUtils.getConfig(guild).modules.moderation.actions.kick["log-channel"]);
            if (!(channel instanceof TextChannel)) {
                return;
            }

            channel.send({embeds: [caseEmbed]});

            caseData.cases.push({
                "type": "KICK_CREATE",
                "id": id,
                "member": user.id,
                "moderator": moderator.id,
                "reason": reason,
                "timestamp": Math.floor(new Date().getTime() / 1000)
            });

            DataUtils.write(guild, "moderation/actions/cases", caseData);
        }
    }
}

module.exports = ActionCase;
