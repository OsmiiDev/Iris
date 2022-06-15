const {GuildMember, Guild, GuildBan, User} = require("discord.js");
const crypto = require("crypto");

const DataUtils = require("../../../utility/DataUtils");

const ActionCase = require("./ActionCase");

const IrisModule = require("../../IrisModule");

/**
 * @description Handles ban punishments
*/
class ActionBan extends IrisModule {
    LISTENERS = [];

    /**
     * @description Constructor
    */
    constructor() {
        super("moderation.actions.ActionBan");

        this.registerEvents();
        ActionBan.expireBans();
    }

    /**
     * @description Bans a specified user from the guild
     * @param {Guild} guild The guild to ban the user from
     * @param {String} memberId The ID of the banned member
     * @param {Number} time How long to ban the user for, in seconds
     * @param {String} reason Why you are muting this user
     * @return {String} The ID of the ban
    */
    static async createBan(guild, memberId, time, reason) {
        const banData = DataUtils.read(guild, "moderation/actions/bans");
        if (!banData[memberId]) {
            banData[memberId] = [];
        }

        time = time * 1;

        const id = `${memberId}:${crypto.randomUUID()}`;

        const permanent = time === 0;

        banData[memberId].push({
            "id": id,
            "reason": reason,
            "start": Math.floor(new Date().getTime() / 1000),
            "end": permanent ? "permanent" : Math.floor(new Date().getTime() / 1000) + time,
            "expired": false
        });

        DataUtils.write(guild, "moderation/actions/bans", banData);

        const member = await guild.members.fetch(memberId).catch(() => {});
        if (member instanceof GuildMember && member.bannable) {
            member.ban({days: DataUtils.getConfig(guild).modules.moderation.actions.ban.purge, reason: reason});
        } else {
            guild.members.ban(memberId, {days: DataUtils.getConfig(guild).modules.moderation.actions.ban.purge, reason: reason});
        }

        if (!permanent) {
            setTimeout(() => {
                ActionBan.deleteBan(guild, id);
            }, time * 1000);
        }

        return id;
    }

    /**
     * @description Deletes a ban with the specified ID
     * @param {Guild|String} guild THe guild to delete the ban from
     * @param {String} banId The ID if the ban to delete
    */
    static async deleteBan(guild, banId) {
        guild = guild instanceof Guild ? guild : await process.client.guilds.fetch(guild);
        if (!(guild instanceof Guild)) {
            return;
        }

        const userId = banId.split(":")[0];

        const banHistory = DataUtils.read(guild, "moderation/actions/bans");
        if (!banHistory[userId]) {
            return;
        }

        for (const ban of banHistory[userId]) {
            if (ban.id === banId) {
                ban.expired = true;
            }
        }

        DataUtils.write(guild, "moderation/actions/bans", banHistory);

        const ban = await guild.bans.fetch(userId);

        if (ban instanceof GuildBan && !ActionBan.hasActiveBan(guild, userId)) {
            guild.bans.remove(userId, "Ban deleted");
        }
    }

    /**
     * @description Checks whether an user has an active ban
     * @param {Guild} guild The guild to check the ban from
     * @param {String} userId The user to check
     * @return {Boolean} Whether the user has an active ban or not
    */
    static hasActiveBan(guild, userId) {
        const bans = DataUtils.read(guild, "moderation/actions/bans")[userId];
        if (!bans) {
            return false;
        }

        for (const ban of bans) {
            if (ban.expired) {
                continue;
            }

            if (ban.end !== "permanent" && Math.floor(new Date().getTime() / 1000) > ban.end) {
                const user = process.client.users.cache.get(userId);
                if (!user) {
                    return;
                }

                ActionBan.deleteBan(guild, ban.id);
                ActionCase.createCase(guild, "BAN_DELETE", user, guild.me, "The ban has expired.");
                continue;
            }

            return true;
        }

        return false;
    }

    /**
     * @description Registers all active bans to be expired
    */
    static async expireBans() {
        const guilds = await process.client.guilds.fetch();
        for (const guildId of guilds.keys()) {
            const punishmentData = DataUtils.read(guildId, "moderation/actions/bans");
            const bans = Object.values(punishmentData).reduce((previous, current) => {
                return previous.concat(current);
            }, []);

            for (const ban of bans) {
                if (ban.end === "permanent") {
                    continue;
                }

                const timeUntil = ban.end - Math.floor(new Date().getTime() / 1000);

                if (ban.expired) {
                    continue;
                }

                if (timeUntil < 0) {
                    ActionBan.deleteBan(guildId, ban.id);
                    const guild = await process.client.guilds.fetch(guildId);
                    const user = await process.client.users.fetch(ban.id.split(":")[0]);
                    if (guild instanceof Guild && user instanceof User) {
                        ActionCase.createCase(guild, "BAN_DELETE", user, guild.me, "The ban has expired.");
                    }
                    continue;
                }

                setTimeout(() => {
                    ActionBan.deleteBan(guildId, ban.id);
                }, timeUntil * 1000);
            }
        }
    }

    /**
     * @description Gets the ban history of a user
     * @param {Guild} guild The guild to get the ban history from
     * @param {String} memberId The ID of the user to get the ban history of
     * @return {Object} The ban history of the user
    */
    static getHistory(guild, memberId) {
        const data = DataUtils.read(guild, "moderation/actions/bans")[memberId];
        return data || [];
    }

    /**
     * @description Gets the default ban time of the user, given punishment matricies
     * @param {Guild} guild The guild to get the ban time from
     * @param {String} memberId The ID of the user to get the ban time of
     * @param {String} matrix The punishment matrix to get the ban time from
     * @return {Object} The ban history of the user
    */
    static getDefaultTime(guild, memberId, matrix) {
        if (DataUtils.getConfig(guild).modules.moderation.actions.ban.behavior !== "matrix") {
            return 0;
        }

        let matrixSettings = DataUtils.getConfig(guild).modules.moderation.actions.matrix.matricies;
        matrixSettings = matrixSettings[matrix || DataUtils.getConfig(guild).modules.moderation.actions.ban.matrix];
        if (!matrixSettings) {
            return 0;
        }

        const banWindow = matrixSettings.window.ban;

        const history = ActionBan.getHistory(guild, memberId);
        let banCount = 0;

        for (const entry of history) {
            if (entry.start + banWindow > Math.floor(new Date().getTime() / 1000)) {
                banCount++;
            }
        }

        return banCount < matrixSettings.times.ban.length ? matrixSettings.times.ban[banCount] : matrixSettings.times.ban[matrixSettings.times.ban.length - 1];
    }
}

module.exports = ActionBan;
