// Still learn how to use mocha
// Reference: http://stackoverflow.com/questions/21293311/how-to-test-node-js-websocket-server
describe('Websocket Server Connection Cabability', function () {
  it('should connect to WebSocketServer with specified Host/Port/Subprotocol', function (done) {
    done();
  })

  it('should send hello greeting to wsServer once connected', function (done) {
    done();
  })

  it('should send text and get the echo text', function (done) {
    done();
  })



})

/*
var wsMock = require("./wsMock.js");
ws = wsMock.createConnectionMock("12345-67890-abcde-fghi-jklmn-opqrs-tuvwxyz");
//(...)
describe('Websocket server', function () {

    it('should set sessionId variable after handshake', function (done) {
        ws.send('handshake', {token: data.token}, function (res) {
            var msg = JSON.parse(res);
            msg.action.should.equal('handshake');
            msg.data.should.be.empty;
            ws.should.have.property('sessionId');
            ws.should.not.have.property('session');
            done();
        })
    })

    it('should not return error when making request after handshake', function (done) {
        ws.send('titleAutocomplete', {query: "ter"}, function (res) {
            var msg = JSON.parse(res);
            msg.action.should.equal('titleAutocomplete');
            msg.data.should.be.an.Object;
            ws.should.have.property('session');
            done();
        })
    })
})
*/
