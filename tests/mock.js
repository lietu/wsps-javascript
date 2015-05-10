/* global describe, it */
if (typeof require !== "undefined") {
    var WSPS = require("../dist/wsps.js");
    var expect = require("expect.js");
}

// TODO: Actually mock something
describe("Mock tests", function () {

    it('Connection events are handled correctly', function (done) {

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
});
