const {MessageEmbed} = require("discord.js");
const DataUtils = require("./DataUtils");

/**
 * @description Utility functions for messages
*/
class MessageUtils {
    /**
     * @description Generates an embed
     * @param {String} title The title of the embed
     * @param {String} description The description of the embed
     * @param {String} color The color of the embed
     * @param {ClientUser} user The user to get the info of for the embed author
     * @return {MessageEmbed} The embed object
    */
    static generateEmbed(title, description, color, user) {
        const embed = new MessageEmbed();
        embed.setTitle(title || "").setDescription(description || "").setColor(color || "");

        if (user) {
            embed.setAuthor({name: user.tag, iconURL: user.avatarURL()});
        }

        return embed;
    }

    /**
     * @description Generates an embed with the error template
     * @param {String} error The error message
     * @return {MessageEmbed} The embed object
    */
    static generateErrorEmbed(error) {
        if (error) {
            return MessageUtils.generateEmbed("", `<:Iris_TickNo:977399764494741524> ${error}`, "#BB4466");
        } else {
            return MessageUtils.generateEmbed("", "<:Iris_TickNo:977399764494741524> Something went wrong.", "#BB4466");
        }
    }

    /**
     * @param {String} name
     * @return {String} The username, with all instances of "clyde" replaced
    */
    static replaceClyde(name) {
        return name.replace(/clyde/ig, function(match) {
            return `${match.slice(0, 2)}\u17b5${match.slice(2)}`;
        });
    }

    /**
     * @param {Message} message The message to check
     * @param {String} name The name of the command
     * @return {Boolean} Whether the message is the specified command
     */
    static isCommand(message, name) {
        return message.content.split(" ")[0].toLowerCase().startsWith(`${DataUtils.getConfig(message.guild).prefix}${name}`);
    }
}

module.exports = MessageUtils;
