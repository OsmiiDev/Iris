const MessageUtils = require("../utility/MessageUtils");

/**
 * @description Base user context menu command class
*/
class UserCommand {
    /**
     * @description Constructor
     * @param {String} name
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

module.exports = UserCommand;
