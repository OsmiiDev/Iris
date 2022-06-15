const {GuildMember, Guild} = require("discord.js");
const crypto = require("crypto");

const DataUtils = require("../../../utility/DataUtils");
const ActionCase = require("./ActionCase");
const ActionMatrix = require("./ActionMatrix");

const IrisModule = require("../../IrisModule");

/**
 * @description Handles muting of members
*/
class ActionMute extends IrisModule {
    LISTENERS = [];

    /**
     * @description Constructor
    */
    constructor() {
        super("moderation.actions.ActionMute");

        this.registerEvents();
        ActionMute.expireMutes();
    }

    /**
     * @description Mutes a specified user, preventing them from talking, reacting, or connecting to voice channels
     * @param {GuildMember} member The member to mute
     * @param {Number} time How long to mute the user for, in seconds
     * @param {String} reason Why you are muting this user
     * @param {String} matrix The punishment matrix to use
     * @return {String} The ID of the mute
    */
    static async createMute(member, time, reason, matrix) {
        const muteData = DataUtils.read(member.guild, "moderation/actions/mutes");
        if (!muteData[member.id]) {
            muteData[member.id] = [];
        }

        const id = `${member.id}:${crypto.randomUUID()}`;

        const permanent = time === 0;

        muteData[member.id].push({
            "id": id,
            "reason": reason,
            "start": Math.floor(new Date().getTime() / 1000),
            "end": permanent ? "permanent" : Math.floor(new Date().getTime() / 1000) + time,
            "expired": false,
            "matrix": matrix || DataUtils.getConfig(member.guild).modules.moderation.actions.mute.matrix
        });

        DataUtils.write(member.guild, "moderation/actions/mutes", muteData);

        ActionMatrix.handleMatrix(member.guild, matrix || DataUtils.getConfig(member.guild).modules.moderation.actions.mute.matrix, member.user, "mute");

        if (!permanent && DataUtils.getConfig(member.guild).modules.moderation.actions.mute.timeout) {
            member.timeout(time * 1000, reason).catch(() => { });
        }
        if (DataUtils.getConfig(member.guild).modules.moderation.actions.mute.role) {
            member.roles.add(DataUtils.getConfig(member.guild).modules.moderation.actions.mute.role);
        }

        if (!permanent) {
            setTimeout(() => {
                ActionMute.deleteMute(member.guild, id);
            }, time * 1000);
        }
        return id;
    }

    /**
     * @description Deletes a mute with the specified ID
     * @param {Guild} guild The guild to delete the mute from
     * @param {String} muteId The ID if the mute to delete
    */
    static async deleteMute(guild, muteId) {
        guild = guild instanceof Guild ? guild : await process.client.guilds.fetch(guild);
        if (!(guild instanceof Guild)) {
            return;
        }

        const userId = muteId.split(":")[0];

        const muteHistory = DataUtils.read(guild, "moderation/actions/mutes");
        if (!muteHistory[userId]) {
            return;
        }

        for (const mute of muteHistory[userId]) {
            if (mute.id === muteId) {
                mute.expired = true;
            }
        }

        DataUtils.write(guild, "moderation/actions/mutes", muteHistory);

        const member = await guild.members.fetch(userId).catch(() => {});

        if (member instanceof GuildMember && member.manageable && member.moderatable && !ActionMute.hasActiveMute(member)) {
            member.roles.remove(DataUtils.getConfig(guild).modules.moderation.actions.mute.role);
            member.timeout(0);
        }
    }

    /**
     * @description Checks whether an user has an active mute
     * @param {GuildMember} member The member to check
     * @return {Boolean} Whether the user has an active mute or not
    */
    static hasActiveMute(member) {
        const mutes = DataUtils.read(member.guild, "moderation/actions/mutes")[member.id];
        if (!mutes) {
            return false;
        }

        for (const mute of mutes) {
            if (mute.expired) {
                continue;
            }

            if (mute.end !== "permanent" && Math.floor(new Date().getTime() / 1000) > mute.end) {
                ActionMute.deleteMute(member.guild, mute.id);
                ActionCase.createCase(member.guild, "MUTE_DELETE", member, member.guild.me, "The mute has expired.");
                continue;
            }

            return true;
        }

        return false;
    }

    /**
     * @description Registers all active mutes to be expired
    */
    static async expireMutes() {
        const guilds = await process.client.guilds.fetch();
        for (const guildId of guilds.keys()) {
            const punishmentData = DataUtils.read(guildId, "moderation/actions/mutes");
            const mutes = Object.values(punishmentData).reduce((previous, current) => {
                return previous.concat(current);
            }, []);

            for (const mute of mutes) {
                if (mute.end === "permanent") {
                    continue;
                }

                const timeUntil = mute.end - Math.floor(new Date().getTime() / 1000);

                if (mute.expired) {
                    continue;
                }

                if (timeUntil < 0) {
                    ActionMute.deleteMute(guildId, mute.id);
                    const guild = await process.client.guilds.fetch(guildId);
                    const member = await guild.members.fetch(mute.id.split(":")[0]).catch(() => {});

                    if (guild instanceof Guild && member instanceof GuildMember) {
                        ActionCase.createCase(guild, "MUTE_DELETE", mute.id, member, member.guild.me, "The mute has expired.");
                    }
                    continue;
                }

                setTimeout(() => {
                    ActionMute.deleteMute(guildId, mute.id);
                }, timeUntil * 1000);
            }
        }
    }

    /**
     * @description Gets the mute history of a user
     * @param {GuildMember} member The member ot get the mute history of
     * @return {Object} The mute history of the user
    */
    static getHistory(member) {
        const data = DataUtils.read(member.guild, "moderation/actions/mutes")[member.id];
        return data || [];
    }

    /**
     * @description Gets the default mute time of the user, given punishment matricies
     * @param {GuildMember} member The user
     * @param {String} matrix The punishment matrix
     * @return {Object} The mute history of the user
    */
    static getDefaultTime(member, matrix) {
        if (DataUtils.getConfig(member.guild).modules.moderation.actions.mute.behavior !== "matrix") {
            return 0;
        }

        let matrixSettings = DataUtils.getConfig(member.guild).modules.moderation.actions.matrix.matricies;
        matrixSettings = matrixSettings[matrix || DataUtils.getConfig(member.guild).modules.moderation.actions.mute.matrix];
        if (!matrixSettings) {
            return 0;
        }

        const muteWindow = matrixSettings.window.mute;

        const history = ActionMute.getHistory(member);
        let muteCount = 0;

        for (const entry of history) {
            if (entry.start + muteWindow > Math.floor(new Date().getTime() / 1000)) {
                muteCount++;
            }
        }

        return muteCount < matrixSettings.times.mute.length ? matrixSettings.times.mute[muteCount] : matrixSettings.times.mute[matrixSettings.times.mute.length - 1];
    }
}

module.exports = ActionMute;
