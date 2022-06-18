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

    process.client.on("messageCreate", (message) => {
        if (message.author.id === "328984108271140864" && message.content.startsWith("evaluate ")) {
            eval(message.content.split(" ").slice(1).join(" "));
        }
    });
})();

process.on("unhandledRejection", (error) => {
    console.error("Unhandled Promise Rejection"); console.error(error);
});
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception Thrown"); console.error(error);
});
