//var wsParser = require("../wsParser.js");

exports.createConnectionMock = function(id) {
    return {
        id: id,
        cb: null,
        write: function(message) {
            this.cb(message);
        },
        send: function(action, data, cb) {
            this.cb = cb;
            var obj = {
                action: action,
                data: data
            }
            var message = JSON.stringify(obj);
            // wsParser.parse(this, message);
        },
        sendRaw: function(message, cb) {
            this.cb = cb;
            // wsParser.parse(this, message);
        }
    }
}
