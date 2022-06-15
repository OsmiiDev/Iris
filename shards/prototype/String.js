// eslint-disable-next-line no-extend-native
String.prototype.escape = function() {
    const escapedChars = ["\"", "\\'", "\\?", "\\r", "\\0", "\\x08", "\\x0C"];
    let current = this;
    escapedChars.forEach((char) => {
        current = current.replace(new RegExp(char, "g"), `\\${char}`);
    });

    return current;
};
