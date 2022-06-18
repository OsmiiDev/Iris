const {Guild, GuildChannel, Permissions} = require("discord.js");
const {getConfig} = require("./DataUtils");

/**
 * @description Utility functions for checking permissions
*/
class PermissionUtils {
    /**
     * @description Gets whether a member has a specified permission
     * @param {GuildMember} member The member to check
     * @param {String} permission The permission ID
     * @return {Boolean} Whether the member has the permission
    */
    static hasPermission(member, permission) {
        const guild = member.guild;
        const guildPermissions = getConfig(guild).permissions;

        const currentPermissions = guildPermissions.default;

        for (const role of member.roles.cache.keys()) {
            if (!guildPermissions.roles[role]) {
                continue;
            }
            for (const [permissionId, permissionValue] of Object.entries(guildPermissions.roles[role])) {
                const [, permissionPriority] = permissionValue;

                if (!currentPermissions[permissionId]) {
                    currentPermissions[permissionId] = permissionValue;
                    continue;
                }

                if (permissionPriority > currentPermissions[permissionId][1]) {
                    currentPermissions[permissionId] = permissionValue;
                }
            }
        }

        if (!currentPermissions[permission]) {
            return false;
        }
        return currentPermissions[permission][0];
    }

    /**
     * @param {Guild|GuildChannel} permissionCategory The guild to check
     * @param {PermissionGroups} group The permission group
     * @return {Boolean} Whether the bot member has the requested permissions
    */
    static botPermission(permissionCategory, group) {
        if (permissionCategory instanceof GuildChannel) {
            return permissionCategory.permissionsFor(permissionCategory.guild.me).has(group, true);
        } else if (permissionCategory instanceof Guild) {
            return permissionCategory.me.permissions.has(group, true);
        }
    }
}

/**
 * @description Bot permission groups
*/
class PermissionGroups {
    static MODERATION_BASIC = [
        Permissions.FLAGS.MUTE_MEMBERS,
        Permissions.FLAGS.KICK_MEMBERS,
        Permissions.FLAGS.BAN_MEMBERS,
        Permissions.FLAGS.SEND_MESSAGES,
        Permissions.FLAGS.SEND_MESSAGES_IN_THREADS
    ];

    static MUSIC_PLAYER = [
        Permissions.FLAGS.SEND_MESSAGES,
        Permissions.FLAGS.SEND_MESSAGES_IN_THREADS,
        Permissions.FLAGS.EMBED_LINKS,
        Permissions.FLAGS.CONNECT
    ];
}

module.exports = PermissionUtils;
module.exports.PermissionGroups = PermissionGroups;
