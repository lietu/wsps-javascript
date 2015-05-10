# WSPS JavaScript client

This is a JavaScript client for [WSPS server](http://github.com/lietu/wsps-server). It should work equally well in a (modern) browser or Node.js.
 
WSPS stands for WebSocket Pub(lisher)-Sub(scriber), and that pretty much covers what it does. The WSPS server provides a WebSocket interface for clients to subscribe to messages on different "channels", and then publishing messages on those channels.

Licensed under MIT and new BSD licenses, more details in `LICENSE.md`.


## Supported environments

WSPS uses WebSocket (RFC 6455) and this should work on anything supporting them.
Any modern browser should be supported, but there is a notable exception: Android browser.

If you are planning on supporting Android browser pre 4.4, you might have some issues. However, if you are using Cordova you can install CrossWalk which has modern WebSocket support.

For browsers this is standalone and has no dependencies other than if you want to further develop wsps-javascript itself.

The library also works on Node.js, but it uses the `ws` -library for WebSocket support.

For WSS (SSL-protected WebSocket) you should terminate SSL with something like Nginx.


## Performance

Using the bundled `latency.html` -test I've managed to get about 3,000 messages/sec bounced through the WSPS server with the client, with an average latency of 0.3msec over localhost using Chrome 42 with a i7-4930k CPU running Windows 7.

Using 20 tabs on `listener.html` and 5 tabs on `sender.html` I managed to get a total throughput of 1,000 messages in and 10,000 messages out per second.

Keep in mind these are over *localhost*, real world performance will be different but the numbers show the overhead should be fairly low.


## Usage

### Example

This example assumes the WSPS server is running at localhost:52525.

The server `local_settings.py` should contain the following:

```python
LISTEN_PORT = 52525

SUBSCRIBE_KEYS = {
    r"some-channel": "subscribe-key"
}

PUBLISH_KEYS = {
    r"some-channel": "publish-key"
}

AUTHORIZATION_MANAGER = 'wspsserver.auth:SettingsAuthManager'
```

After that, this code should work in a browser with WSPS script loaded:
```javascript
var subscribeKey = "subscribe-key";
var writeKey = "publish-key";

var wsps = WSPS.create({
    server: "ws://localhost:52525",
    onclose: function() {
        console.log("Disconnected, reconnecting...");
        wsps.connect();
    }
});

var receive = function(packet) {
    console.log(packet.data.msg);
};

wsps.subscribe("some-channel", receive, subscribeKey);
wsps.connect();

var send = function() {
    wsps.publish("some-channel", {msg: "Hello, WSPS!"}, writeKey);
};

setTimeout(send, 2500);
```

In Node.js you only need to prepend:
```javascript
var WSPS = require("wsps");
```


### Configuration

The config object you give to `WSPS.create` can have the following properties:
 * `server` - **Mandatory**: The full URI for the server, e.g. `ws://localhost:52525/`
 * `onconnect` - Callback to be run when a connection is established
 * `onclose` - Callback to be run when the connection fails or disconnects for any reason
 * `debug` - Enable some logging by the library straight to console

 
### API
 
Here's per-method documentation for the library.

**WSPS.create(config)**

Creates a new instance of a WSPS connection. You generally can only have one connection per destination address.

Arguments:

 * `config` - An object containing configuration as per the above section

Returns a configured instance of the WSPS client.


**instance.connect()**

Attempts to connect to the server, if connection fails the onclose callback is called. If connection is successful the onconnect callback is called.


**instance.disconnect()**

Disconnects from the server, calls the onclose callback.


**instance.publish(channel, data[, key])**

Publish a message to a channel.

Arguments:

 * `channel` - The name of the channel to subscribe to
 * `data` - The data to send, string, int, bool, object, pretty much whatever.
 * `key` - **Optional**: The authorization key for publishing to the channel, if required in WSPS server configuration.

Returns false if that failed due to e.g. connection not being established yet, true if the message was successfully published.


**instance.subscribe(channel, callback[, key])**

Subscribe to messages from a channel.

Arguments:

 * `channel` - The name of the channel to subscribe to
 * `callback` - The callback that should get the packets from the channel. You can have multiple subscribers to the same channel.
 * `key` - **Optional**: The authorization key for subscribing to the channel, if required in WSPS server configuration.


## Development

### Prerequisites

You'll need Node.js and npm available in the environment: [https://nodejs.org/](https://nodejs.org/), and some modern browser.


### Install development dependencies

All the dependencies can be easily installed npm and bower, but you'll need gulp available globally.

```
npm install -g gulp bower
npm install
bower install
```


### Build and test 

The tests expect a WSPS server running with the default settings on localhost.

To lint, concatenate, minify, run tests, and watch for changes just run gulp:
```
gulp
```
