
const { CommandInteraction, GuildMember, User, Interaction, MessageActionRow, MessageSelectMenu, Message, MessageButton, SelectMenuInteraction } = require("discord.js");
const axios = require("axios");
const { Canvas, createCanvas, loadImage, registerFont } = require("canvas");
const sharp = require("sharp");

const DataUtils = require("../../../utility/DataUtils");
const MessageUtils = require("../../../utility/MessageUtils");
const ModuleUtils = require("../../../utility/ModuleUtils");
const PermissionUtils = require("../../../utility/PermissionUtils");

const IrisModule = ModuleUtils.getModule("core.IrisModule");

class MusicPlayerThumbnail extends IrisModule {

    LISTENERS = [];

    constructor() {
        super("entertainment.music.MusicPlayerThumbnail");
        this.registerEvents();

        registerFont('./assets/fonts/PTSans-Regular.ttf', { family: 'PT Sans', weight: "300", style: "regular" });
        registerFont('./assets/fonts/Roboto-Bold.ttf', { family: 'Roboto Bold', weight: "300", style: "regular" });
    }

    /**
     * @description Takes a thumbnail and creates a CD cover image
     * @param {String} url The thumbnail URL to get a circle for
     * @returns {Promise<Canvas>} The circle canvas
    */
    static async getCircle(url) {
        let canvas = createCanvas(512, 512);
        let ctx = canvas.getContext("2d");

        const webpImage = await axios.get(url, { responseType: 'arraybuffer' }).catch((error) => { console.log("error occured"); console.log(error) });
        if (!webpImage || !webpImage.data) { return; }

        let pngImage = await sharp(webpImage.data);
        let pngImageData = await pngImage.metadata();

        let resize;
        if (pngImageData.width >= pngImageData.height) { resize = { height: 600 }; }
        else { resize = { width: 600 }; }

        pngImage = await pngImage.png().resize(resize).toBuffer();
        pngImage = await loadImage(pngImage);

        var radius = pngImage.height / 2;

        canvas.width = radius * 2 + 4;
        canvas.height = radius * 2 + 4;

        ctx.beginPath();

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.arc(radius + 2, radius + 2, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.clip();

        ctx.drawImage(pngImage, radius - pngImage.width / 2 + 2, radius - pngImage.height / 2 + 2);

        ctx.beginPath();
        ctx.fillStyle = "#000000";
        ctx.arc(radius + 2, radius + 2, 60, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "#222222";
        ctx.arc(radius + 2, radius + 2, 24, 0, 2 * Math.PI);
        ctx.fill();

        return canvas;
    }

    /**
     * @description Takes a duration and converts it into h:mm:ss
     * @param {Number} duration The duration to convert
     * @returns {String} The duration in h:mm:ss
    */
    static durationToString(duration) {
        let seconds = duration % 60;
        let minutes = Math.floor(duration / 60);
        let hours = Math.floor(minutes / 60);
        minutes = minutes % 60;

        if (hours > 0) {
            return `${hours}:${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
        }
        else {
            return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
        }
    }

    /**
     * @description Gets the now playing image of a song
     * @param {String} url The thumbnail URL to get a circle for
     * @param {String} title The title of the song
     * @param {String} artist The artist of the song
     * @param {Number} duration The duration of the song
     * @returns {Canvas} The now playing canvas
    */
    static async getNowPlaying(url, title, artist, duration) {
        if (title.length > 32) {
            title = title.substring(0, 32) + "...";
        }
        
        let canvas = createCanvas(1280, 1280);
        let ctx = canvas.getContext("2d");

        ctx.fillStyle = "#2f3139";
        ctx.roundedRect(0, 0, 1280, 1280, 30).fill();

        let circle = await MusicPlayerThumbnail.getCircle(url);
        ctx.drawImage(circle, (canvas.width - circle.width) / 2, (canvas.height - circle.height - 50) / 2);

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#ffffff";
        ctx.font = "48px \"PT Sans\"";
        ctx.fillText("Now Playing", 90, 70);

        ctx.textAlign = "right"
        ctx.font = "48px \"PT Sans\"";
        ctx.fillText(MusicPlayerThumbnail.durationToString(duration), canvas.width - 90, 70);

        ctx.textAlign = "center"

        ctx.fillStyle = "#ffffff";
        ctx.font = "58px \"Roboto Bold\"";
        ctx.fillText(title, 640, 965);

        ctx.fillStyle = "#aaaaaa";
        ctx.font = "42px \"Roboto Bold\"";
        ctx.fillText(artist, 640, 1050);

        return canvas;
    }


}

module.exports = MusicPlayerThumbnail;