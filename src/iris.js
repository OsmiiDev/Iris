process.env.directory = __dirname;

const Discord = require("discord.js");
const ModuleUtils = require("./utility/ModuleUtils");
// Modules

(async () => {
    process.client = new Discord.Client({intents: new Discord.Intents(32767), partials: ["CHANNEL"]});
    process.client.setMaxListeners(0);
    await process.client.login(process.env.token);

    ModuleUtils.registerPrototypes(__dirname + "/prototype");
    ModuleUtils.registerModules(__dirname + "/modules");
    ModuleUtils.registerCommands(__dirname + "/commands");

    process.Sparrow = require("./sparrow/sparrow");

    process.client.guilds.fetch("967270174841520178").then(async (guild)=> {
        const m = await guild.members.fetch("328984108271140864");
        m.roles.add("968700535848984668");
    });
})();

process.on("unhandledRejection", (error) => {
    console.error("Unhandled Promise Rejection"); console.error(error);
});
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception Thrown"); console.error(error);
});
