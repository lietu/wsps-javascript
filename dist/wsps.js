(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('wsps', [], factory);
    } else if (typeof require === 'function' && ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null)) {
        return module.exports = factory();
    } else {
        root.WSPS = factory();
    }
})(this, function () {

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
var hasWebsocket = (typeof WebSocket !== "undefined");
var hasProcess = (typeof process !== "undefined");
var hasRequire = (typeof require !== "undefined");

var browser = !(!hasWebsocket && hasProcess && hasRequire);

if (!browser) {
    // Adding var here will annoyingly make this fail on browsers
    WebSocket = require('ws');
}

var DEBUG = false;

var WSPS = extend({}, {
    /**
     * Create a new instance of a WSPS connection
     *
     * @param {Object} config Configuration settings
     */
    create: function create(config) {
        var _this = Object.create(this);

        var defaults = {
            server: undefined,
            onconnect: undefined,
            onclose: undefined,
            debug: DEBUG
        };

        for (var key in defaults) {
            if (defaults.hasOwnProperty(key) && config[key] === undefined) {
                config[key] = defaults[key];
            }
        }

        _this._initialize(config);
        return _this;
    },

    /**
     * Connect to the remote server
     */
    connect: function connect() {
        if (this._socket) {
            this.disconnect();
        }

        this._log("Connecting to WSPS server at: " + this._config.server);

        var _this = this;
        this._socket = new WebSocket(this._config.server);

        if (browser) {
            this._socket.onopen = function () {
                _this._onopen();
            };
            this._socket.onclose = function () {
                _this._onclose();
            };
            this._socket.onmessage = function (event) {
                _this._onmessage(event.data);
            };
            this._socket.onerror = function () {
                _this._onerror();
            };
        } else {
            this._socket.on('open', function () {
                _this._onopen();
            });
            this._socket.on('message', function (data) {
                _this._onmessage(data);
            });
            this._socket.on('close', function () {
                _this._onclose();
            });
        }
    },

    /**
     * Disconnect from the server
     */
    disconnect: function disconnect() {
        this._socket.close();
        this._socket = null;
    },

    /**
     * Publish a message to the channel
     *
     * @param {String} channel Name of the channel to publish to
     * @param {Object} data Data to publish in payload
     * @param {String} key Optional: authentication key
     */
    publish: function publish(channel, data, key) {
        if (!this._socket) {
            throw new Error("Trying to publish data without a connection");
        }

        var packet = {
            type: "publish",
            channel: channel,
            data: data,
            key: key
        };

        try {
            this._socket.send(JSON.stringify(packet));
            return true;
        } catch (e) {
            this._log("Caught error when sending", e);
            return false;
        }
    },

    /**
     * Subscribe to messages on a channel
     *
     * @param {String} channel Name of the channel
     * @param {Function} callback Function that will get all the messages
     * @param {String} key Optional: Authentication key
     */
    subscribe: function subscribe(channel, callback, key) {
        if (!this._channelListeners[channel]) {
            this._channelListeners[channel] = [];
        }

        this._channelListeners[channel].push(callback);
        this._subscribe(channel, key);
    },

    /**
     * Initialize the instance variables
     *
     * @param config
     */
    _initialize: function _initialize(config) {
        this._validateConfig(config);

        this._config = config;
        this._channelListeners = {};
        this._subscriptions = [];
        this._socket = null;
    },

    /**
     * Validate that the given configuration is sufficient
     *
     * @param {Object} config
     */
    _validateConfig: function validateConfig(config) {
        if (!config.server) {
            throw new Error("Cannot initialize WSPS without a server.");
        }
    },

    /**
     * Tell the server that we want messages for the given channel
     *
     * @param {String} channel
     * @param {String} key Optional: authentication key
     * @private
     */
    _subscribe: function _subscribe(channel, key) {
        this._subscriptions.push({
            channel: channel,
            key: key
        });

        if (this._socket) {
            var packet = {
                type: "subscribe",
                channel: channel,
                key: key
            };

            this._socket.send(JSON.stringify(packet));
        }
    },

    /**
     * Handler for open event from WebSocket
     *
     * @private
     */
    _onopen: function _onopen() {
        this._log("Connection to " + this._config.server + " opened");

        // Subscribe existing listeners
        for (var channel in this._subscriptions) {
            var settings = this._subscriptions[channel];
            this._subscribe(settings.channel, settings.key);
        }

        // Call onconnect callback
        if (this._config.onconnect) {
            this._config.onconnect();
        }
    },

    /**
     * Handler for close event from WebSocket
     *
     * @private
     */
    _onclose: function _onclose() {
        this._log("Connection to " + this._config.server + " closed");

        // Call onclose callback
        if (this._config.onclose) {
            this._config.onclose();
        }
    },

    /**
     * Handler for messages from WebSocket
     *
     * @param {String} data Data string
     * @private
     */
    _onmessage: function _onmessage(data) {

        var packet = JSON.parse(data);
        // this._log("Got message from " + this._config.server, packet);

        var listeners = this._channelListeners[packet.channel];
        if (listeners) {
            for (var i = 0, count = listeners.length; i < count; i += 1) {
                listeners[i](packet);
            }
        }
    },

    /**
     * WebSocket error handler
     *
     * @private
     */
    _onerror: function _onerror() {
        this._log("_onerror");
    },

    /**
     * Log something, if in debug mode
     *
     * @private
     */
    _log: function _log() {
        if (!this._config.debug || typeof console === "undefined" || !console.log) {
            return;
        }

        var args = Array.prototype.splice.call(arguments, 0);
        args.unshift(this._getTimestamp());

        console.log.apply(console, args);
    },

    /**
     * Get a timestamp for logging purposes
     *
     * @param {Date} date
     * @returns {String}
     * @private
     */
    _getTimestamp: function _getTimestamp(date) {
        date = date || new Date();

        var utcDate = new Date(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds(),
            date.getUTCMilliseconds()
        );

        return utcDate.toISOString();
    }
});

    return WSPS;
});
