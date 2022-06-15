const MessageUtils = require("../utility/MessageUtils");

/**
 * @description Base slash command class
*/
class SlashCommand {
    /**
     * @description Constructor
     * @param {String} name The name of the command
    */
    constructor(name) {
        this.name = name;
    }

    /**
     * @description Gets the name of the command
     * @return {String} The name of the command
    */
    static getName() {
        return this.name;
    }

    /**
     * @description Generates an error embed
     * @param {?String} error The error message
     * @return {MessageEmbed} The error embed
    */
    static getError(error) {
        if (error) {
            return MessageUtils.generateEmbed("", `<:Iris_TickNo:977399764494741524> ${error}`, "#BB4466");
        } else {
            return MessageUtils.generateEmbed("", "<:Iris_TickNo:977399764494741524> Something went wrong.", "#BB4466");
        }
    }
}

module.exports = SlashCommand;
