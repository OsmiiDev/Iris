const MessageUtils = require("../utility/MessageUtils");

/**
 * @description Base text command class
*/
class TextCommand {
    /**
     * @description Constructor
     * @param {String} name The name of the command
     * @param {Array<String>} aliases Aliases for the command
     * @param {Function} executor The executor of the command
    */
    constructor(name, aliases, executor) {
        this.name = name;
        this.aliases = aliases;
        this.executor = executor;
    }

    /**
     * @description Gets the name of the command
     * @return {String} The name of the command
    */
    getName() {
        return this.name;
    }

    /**
     * @description Gets the aliases of the command
     * @return {Array<String>} The aliases of the command
    */
    getAliases() {
        return this.aliases;
    }

    /**
     * @description Generates an error embed
     * @param {?String} error The error message
     * @return {MessageEmbed} The error embed
    */
    getError(error) {
        if (error) {
            return MessageUtils.generateEmbed("", `<:Iris_TickNo:977399764494741524> ${error}`, "#BB4466");
        } else {
            return MessageUtils.generateEmbed("", "<:Iris_TickNo:977399764494741524> Something went wrong.", "#BB4466");
        }
    }
}

module.exports = TextCommand;
