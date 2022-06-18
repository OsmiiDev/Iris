// eslint-disable-next-line no-extend-native
Array.prototype.chunk = function(size) {
    if (!this.length) return [];
    return [this.slice(0, size)].concat(this.slice(size).chunk(size));
};
