const {GuildMember} = require("discord.js");
const DataUtils = require("../utility/DataUtils");

GuildMember.prototype.getActionHistory = function(action) {
    const history = DataUtils.read(this.guild, `moderation/actions/${action}`)[this.id];
    return history || [];
};
