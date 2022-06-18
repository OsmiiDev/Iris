
const {ThreadChannel, DMChannel} = require("discord.js");

const DataUtils = require("../../../utility/DataUtils");

const IrisModule = require("../../IrisModule");

/**
 * @description Handles ticket creation and management
*/
class ModmailTicketManager extends IrisModule {
    LISTENERS = [];

    /**
     * @description Constructor
    */
    constructor() {
        super("moderation.modmail.ModmailTicketManager");

        this.registerEvents();
    }

    /**
     * @param {TextChannel} channel The channel to create the ticket in
     * @param {User} user The user to create the ticket for
     * @param {Object} threadOptions Options for thread creation
    */
    static async createTicket(channel, user, threadOptions) {
        try {
            const dmChannel = await user.createDM().catch(() => { });
            const thread = await channel.threads.create({
                name: threadOptions.name || `${user.username}'s ticket`,
                reason: threadOptions.reason || "Creating new ticket",
                autoArchiveDuration: 1440, type: "GUILD_PUBLIC_THREAD",
                startMessage: threadOptions.startMessage || undefined
            });

            const data = {
                "id": require("crypto").randomUUID(),
                "user": user.id,
                "dmChannel": dmChannel.id,
                "threadChannel": thread.id
            };

            const openTicketData = ModmailTicketManager.getOpenData(channel.guild);
            openTicketData[user.id] = data;

            const userData = DataUtils.readUser(user, "modmail");
            userData.open = data;

            DataUtils.write(channel.guild, "moderation/modmail/open", openTicketData);
            DataUtils.writeUser(user, "modmail", userData);

            return [data, thread, dmChannel];
        } catch (error) {
            return [false, false, false];
        }
    }

    /**
     * @description Close a ticket
     * @param {GuildMember} member The member to close the ticket for
    */
    static async closeTicket(member) {
        const openTicketData = ModmailTicketManager.getOpenData(member.guild);
        const closedTicketData = ModmailTicketManager.getClosedData(member.guild);

        if (!openTicketData[member.id]) return [false, false];

        if (!closedTicketData[member.id]) closedTicketData[member.id] = [];

        const data = openTicketData[member.id];
        if (!data) return [false, false];

        closedTicketData[member.id].push(openTicketData[member.id]);
        DataUtils.write(member.guild, "moderation/modmail/closed", closedTicketData);

        delete openTicketData[member.id];

        const userData = DataUtils.readUser(member.user, "modmail");
        userData.open = false;

        DataUtils.write(member.guild, "moderation/modmail/open", openTicketData);
        DataUtils.writeUser(member.user, "modmail", userData);

        const thread = await member.guild.channels.fetch(data.threadChannel);
        return [data, thread instanceof ThreadChannel ? thread : false];
    }

    /**
     * @description Gets the ticket data from a thread or DM channel
     * @param {TextChannel} channel The channel to get ticket data for
     * @return {Object} The ticket data
    */
    static getTicket(channel) {
        if (channel.guild && channel instanceof ThreadChannel) {
            const openTicketData = ModmailTicketManager.getOpenData(channel.guild);
            return Object.values(openTicketData).find((value) => {
                return value.threadChannel === channel.id;
            });
        } else if (channel instanceof DMChannel) {
            return DataUtils.readUser(channel.recipient, "modmail").open;
        }
    }

    /**
     * @description Gets the ticket by a thread
     * @param {Guild} guild The guild to get the tickets from
     * @param {String} threadId The ID of the thread
     * @return {Object} The ticket data
    */
    static getTicketThread(guild, threadId) {
        const openTicketData = ModmailTicketManager.getOpenData(guild);
        return Object.values(openTicketData).find((value) => {
            return value.threadChannel === threadId;
        });
    }
    /**
     * @description Gets the open ticket data from a guild
     * @param {Guild} guild The guild to get the data for
     * @return {Object} The open ticket data for the guild
    */
    static getOpenData(guild) {
        return DataUtils.read(guild, "moderation/modmail/open");
    }

    /**
     * @description Gets the closed ticket data from a guild
     * @param {Guild} guild The guild to get the data for
     * @return {Object} The closed ticket data for the guild
    */
    static getClosedData(guild) {
        return DataUtils.read(guild, "moderation/modmail/closed");
    }
}

module.exports = ModmailTicketManager;
