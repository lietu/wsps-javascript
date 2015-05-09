/**
 * Extend an object
 *
 * @param {Object} source E.g. {} or something returned by this function
 * @param {Object} extension Properties and methods to append/replace
 * @returns {Object}
 */
var extend = function (source, extension) {
    var object = Object.create(source);

    // Copy properties
    for (var key in extension) {
        if (extension.hasOwnProperty(key) || object[key] === "undefined") {
            object[key] = extension[key];
        }
    }

    object.super = function _super() {
        return source;
    };

    return object;
};