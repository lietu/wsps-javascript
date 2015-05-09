/* global describe, it */
if (typeof require !== "undefined") {
    var WSPS = require("../dist/wsps.js");
    var expect = require("expect.js");
}

describe("Live server tests", function () {
    // These tests require a WSPS server running using the default settings.

    it("Can connect", function (done) {

        var wsps = WSPS.create({
            server: "ws://localhost:52525/",
            onconnect: function () {
                wsps.disconnect();
                done();
            }
        });

        expect(wsps).to.not.be(undefined);

        wsps.connect();
    });

    it("Send and receive message", function (done) {

        var channel = "test-channel-" + (Math.random() * 1000000);
        var testMessage = "123 test ok 321";

        var wsps = WSPS.create({
            server: "ws://localhost:52525/",
            onconnect: function () {
                wsps.subscribe(channel, function (packet) {
                    expect(packet.data.message).to.be(testMessage);
                    wsps.disconnect();
                    done();
                });

                // Wait for the listening to be registered
                setTimeout(function () {
                    wsps.publish(channel, {
                        message: testMessage
                    });
                }, 125);
            }
        });

        wsps.connect();
    });

});
