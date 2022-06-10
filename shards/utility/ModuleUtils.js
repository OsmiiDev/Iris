const fs = require("fs");
const IrisModule = require("../modules/IrisModule");

let modules = {
    "core.IrisModule": "../modules/IrisModule.js",
    "entertainment.music.MusicPlayer": "../modules/entertainment/music/MusicPlayer.js",
    "entertainment.music.MusicPlayerCommands": "../modules/entertainment/music/MusicPlayerCommands.js",
    "entertainment.music.MusicPlayerPlaylists": "../modules/entertainment/music/MusicPlayerPlaylists.js",
    "entertainment.music.MusicPlayerQueue": "../modules/entertainment/music/MusicPlayerQueue.js",
    "moderation.actions.ActionBan": "../modules/moderation/actions/ActionBan.js",
    "moderation.actions.ActionBanModals": "../modules/moderation/actions/ActionBanModals.js",
    "moderation.actions.ActionCase": "../modules/moderation/actions/ActionCase.js",
    "moderation.actions.ActionKickModals": "../modules/moderation/actions/ActionKickModals.js",
    "moderation.actions.ActionMatrix": "../modules/moderation/actions/ActionMatrix.js",
    "moderation.actions.ActionMute": "../modules/moderation/actions/ActionMute.js",
    "moderation.actions.ActionMuteModals": "../modules/moderation/actions/ActionMuteModals.js",
    "moderation.actions.ActionWarnModals": "../modules/moderation/actions/ActionWarnModals.js",
    "moderation.modmail.ModmailTicketClose": "../modules/moderation/modmail/ModmailTicketClose.js",
    "moderation.modmail.ModmailTicketCreate": "../modules/moderation/modmail/ModmailTicketCreate.js",
    "moderation.modmail.ModmailTicketLink": "../modules/moderation/modmail/ModmailTicketLink.js",
    "moderation.modmail.ModmailTicketManager": "../modules/moderation/modmail/ModmailTicketManager.js",
    "entertainment.music.MusicPlayerThumbnail": "../modules/entertainment/music/MusicPlayerThumbnail.js",
}

class ModuleUtils {

    /**
     * @description Registers all prototype modifications
     * @param {String} path The directory
    */
    static registerPrototypes(path = "./prototype") {
        let files = fs.readdirSync(path);
        for (let fileName of files) {
            if (fileName.endsWith(".js") || fileName.endsWith(".ts")) {
                require(`${path}/${fileName}`);
            }
            else {
                this.registerPrototypes(`${path}/${fileName}`)
            }
        }
    }

    /**
     * @description Gets a module with a name
     * @param {String} name The name of the module
     * @returns {IrisModule} The module class
    */
    static getModule(name) {
        return name ? modules[name] ? require(modules[name]) : require(`../modules/${name.replace(/\./g, "/")}`) : modules;
    }

    /**
     * @description Registers all module files
     * @param {String} path The directory
    */
    static registerModules(path = "./modules") {
        let files = fs.readdirSync(path);
        for (let fileName of files) {
            if (fileName.endsWith(".js") || fileName.endsWith(".ts")) {
                let moduleFile = require(`${path}/${fileName}`);
                let moduleClass = new moduleFile();

                modules[moduleClass._name] = `${require('path').relative(__dirname, path).replace(/\\/g, "/")}/${fileName}`;
                //get relative path from absolute path

                console.log(`[Shard-${process.shard} REGISTER] Registered module ${moduleClass._name}`);
            }
            else {
                this.registerModules(`${path}/${fileName}`);
            }
        }
    }

    /**
     * @description Regsiters all application commands
     * @param {String} path The directory
    */
    static async registerCommands(path = "./commands") {
        let commands = [];

        commands.push(...ModuleUtils.registerSlashCommands(`${path}/slash`));
        commands.push(...ModuleUtils.registerMessageCommands(`${path}/message`));
        commands.push(...ModuleUtils.registerUserCommands(`${path}/user`));
        let guilds = await process.client.guilds.fetch();

        for (let guildId of guilds.keys()) {
            let guild = await process.client.guilds.fetch(guildId);
            await guild.commands.set(commands);
        }

        console.log(`[Shard-${process.shard} REGISTER] Registered all client commands`);
    }

    /**
     * @description Registers all slash commands
     * @param {String} path The directory
    */
    static registerSlashCommands(path = "./commands/slash") {
        let commands = [];

        let messageCommands = fs.readdirSync(path);
        for (let messageCommand of messageCommands) {
            let commandFile = require(`${path}/${messageCommand}`);

            console.log(`[Shard-${process.shard} REGISTER] Registered slash command ${commandFile.getName()}`);

            commands.push(commandFile.getBuilder().toJSON());

            process.client.on("interactionCreate", (interaction) => {
                if (!interaction.isCommand() || interaction.commandName !== commandFile.getName().toLowerCase()) { return; }

                commandFile.run(interaction);
            });
        }

        return commands;
    }

    /**
     * @description Registers all message context menu commands
     * @param {String} path The directory
    */
    static registerMessageCommands(path = "./commands/message") {
        let commands = [];

        let messageCommands = fs.readdirSync(path);
        for (let messageCommand of messageCommands) {
            let commandFile = require(`${path}/${messageCommand}`);

            console.log(`[Shard-${process.shard} REGISTER] Registered message command ${commandFile.getName()}`);

            commands.push(commandFile.getBuilder());

            process.client.on("interactionCreate", (interaction) => {
                if (!interaction.isMessageContextMenu() || interaction.commandName !== commandFile.getName()) { return; }

                commandFile.run(interaction);
            });
        }

        return commands;
    }

    /**
     * @description Registers all message context menu commands
     * @param {String} path The directory
    */
    static registerUserCommands(path = "./commands/user") {
        let commands = [];

        let userCommands = fs.readdirSync(path);
        for (let userCommand of userCommands) {
            let commandFile = require(`${path}/${userCommand}`);

            console.log(`[Shard-${process.shard} REGISTER] Registered user command ${commandFile.getName()}`);

            commands.push(commandFile.getBuilder());

            process.client.on("interactionCreate", (interaction) => {
                if (!interaction.isUserContextMenu() || interaction.commandName !== commandFile.getName()) { return; }

                commandFile.run(interaction);
            });
        }

        return commands;
    }


}

module.exports = ModuleUtils;