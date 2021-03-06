const {Guild, User} = require("discord.js");
const DataUtils = require("../utility/DataUtils");

Guild.prototype.getActionHistory = function(user, action) {
    const history = DataUtils.read(this.id, `moderation/actions/${action}`)[user instanceof User ? user.id : user];
    return history || [];
};
