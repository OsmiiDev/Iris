const fs = require("fs");

/**
 * @description Utility functions for getting and setting data in guilds
 */
class DataUtils {
    static CONFIG;
    static MODULES;

    /**
     * @description Updates the configuration file
     * @param {(String|Guild)} guild The guild or ID of the guild to get the config of
     * @return {Object} The configuration object
    */
    static getConfig(guild) {
        return DataUtils.read(guild, "config");
    }

    /**
     * @description Reads a specific user's data
     * @param {(String|User)} user The user or ID of the user to read data from
     * @param {String} path The location of the JSON file in the user's data directory
     * @return {Object} The JSON data
    */
    static readUser(user, path) {
        path = path.endsWith(".json") ? path : `${path}.json`;
        let data = {};

        try {
            data = JSON.parse(fs.readFileSync(`./data/users/${user.id || user}/${path}`).toString());
        } catch (error) {
            fs.mkdirSync(`./data/users/${user.id || user}/${path.split("/").slice(0, -1).join("/")}`, {recursive: true});
        }

        return data;
    }

    /**
     * @description Writes a user's data
     * @param {(String|User)} user The user or ID of the user to read data from
     * @param {path} path The location of the JSON file in the user's data directory
     * @param {Object} data The data to save
    */
    static writeUser(user, path, data) {
        path = path.endsWith(".json") ? path : `${path}.json`;

        try {
            fs.accessSync(`./data/users/${user.id || user}/${path}`);
        } catch (error) {
            fs.mkdirSync(`./data/users/${user.id || user}/${path.split("/").slice(0, -1).join("/")}`, {recursive: true});
        }

        fs.writeFileSync(`./data/users/${user.id || user}/${path}`, JSON.stringify(data, null, 4));
    }

    /**
     * @description Reads data from a specified file
     * @param {(String|Guild)} guild The guild or ID of the guild to read data from
     * @param {String} path The location of the JSON file in the guild's data directory
     * @return {Object} The JSON data
    */
    static read(guild, path) {
        path = path.endsWith(".json") ? path : `${path}.json`;
        return JSON.parse(fs.readFileSync(`./data/guilds/${guild.id || guild}/${path}`).toString());
    }

    /**
     * @description Writes data into a specified file
     * @param {(String|Guild)} guild The guild or ID of the guild to read data from
     * @param {String} path The location of the JSON file in the guild's data directory
     * @param {Object} data The data to save
    */
    static write(guild, path, data) {
        path = path.endsWith(".json") ? path : `${path}.json`;
        fs.writeFileSync(`./data/guilds/${guild.id || guild}/${path}`, JSON.stringify(data, null, 4));
    }

    /**
     * @description Parses a time string into a number of seconds
     * @param {String} timeString The time string, in the format x weeks x months x day etc.
     * @return {Number} The time in seconds
    */
    static parseTime(timeString) {
        let time = 0;
        if (!timeString || timeString.split(" ").length % 2 === 1) {
            return 0;
        }

        const timeSplit = timeString.toLowerCase().split(" ").chunk(2);

        for (let [value, unit] of timeSplit) {
            if (unit.endsWith("s")) {
                unit = unit.slice(0, -1);
            }

            if (value <= 0) {
                continue;
            }

            if (unit === "year") {
                time += value * 60 * 60 * 24 * 365;
            }
            if (unit === "month") {
                time += value * 60 * 60 * 24 * 30;
            } else if (unit === "week") {
                time += value * 60 * 60 * 24 * 7;
            } else if (unit === "day") {
                time += value * 60 * 60 * 24;
            } else if (unit === "hour") {
                time += value * 60 * 60;
            } else if (unit === "minute") {
                time += value * 60;
            } else if (unit === "second") {
                time += value * 1;
            }
        }

        return time;
    }

    /**
     * @description Parses a number of seconds into a human readable time string
     * @param {Number} time The time in seconds
     * @return {String} The time string, in the format x weeks x months x day etc.
    */
    static parseTimeToString(time) {
        const years = Math.floor(time / (60 * 60 * 24 * 365));
        time -= years * 60 * 60 * 24 * 365;
        const weeks = Math.floor(time / (60 * 60 * 24 * 7));
        time -= weeks * 60 * 60 * 24 * 7;
        const days = Math.floor(time / (60 * 60 * 24));
        time -= days * 60 * 60 * 24;
        const hours = Math.floor(time / (60 * 60));
        time -= hours * 60 * 60;
        const minutes = Math.floor(time / (60));
        time -= minutes * 60;
        const seconds = time;

        let timeString = "";
        if (years > 0) {
            timeString += years === 1 ? "1 year" : `${years} years`;
        }
        if (weeks > 0) {
            timeString += weeks === 1 ? "1 week" : `${weeks} weeks`;
        }
        if (days > 0) {
            timeString += days === 1 ? "1 day" : `${days} days`;
        }
        if (hours > 0) {
            timeString += hours === 1 ? "1 hour" : `${hours} hours`;
        }
        if (minutes > 0) {
            timeString += minutes === 1 ? "1 minute" : `${minutes} minutes`;
        }
        if (seconds > 0) {
            timeString += seconds === 1 ? "1 second" : `${seconds} seconds`;
        }

        return timeString;
    }
}

module.exports = DataUtils;
