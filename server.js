/**
 * WebSocket Multicast by Subprotocol Example
 *
 *  Server usage:
 *    node server.js
 *
 *  Client usage:
 *  - 1. Simply use wscat (npm install -g wscat)
 *    # wscat -c "ws://localhost:6789" -s "chat_room_001"
 *    Then open more terminal to connect the same "chat_room_001" or other channel "other_group"
 *    # wscat -c "ws://localhost:6789" -s "chat_room_002"
 *  - 2. var device = new WebSocket('ws://localhost:8080', 'chatroom_001');
 *
 *  Copyright(c) 2016 Jimmy Liao <sjliaogmail.com>
 *  Date: 2016/06/04
 *  MIT Licensed
 */

var SERVER_PORT = 6789;

var CircularJSON = require('circular-json');
var uuid = require('node-uuid');
var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;
var wss = new WebSocketServer({
    port: SERVER_PORT,
    //handleProtocols: protocolHandler
    handleProtocols: "your_chatroom_name"
});

var clients = [];

function wsSend(type, client_uuid, nickname, message) {
    for (var i = 0; i < clients.length; i++) {
        //console.log(Object.keys(clients[i]));
        var clientSocket = clients[i].ws;
        console.log('channel: ' + clients[i].channel);
        if ((clientSocket.readyState === WebSocket.OPEN)) {
            clientSocket.send(JSON.stringify({
                "type": type,
                "id": client_uuid,
                "nickname": nickname,
                "message": message
            }));
        }
    }
}

function wsMulticast(target_channel, client_uuid, nickname, message) {
    console.log('[multicast]: target channel ' + target_channel);
    console.log('[multicast]: message from ' + client_uuid);

    // check message originator's channel
    console.log('## check message originator channel');

    // find message originator channel
    for (var i = 0; i < clients.length; i++) {
        var clientSocket = clients[i].ws;
        if (clients[i]["id"] == client_uuid) {
            console.log('originator channe: ' + clients[i]["channel"]);
            target_channel = clients[i]["channel"];
            break;
        } else {
            //
        }
    }

    console.log('target channel changed: ' + target_channel);
    var client_group = [];

    for (var i = 0; i < clients.length; i++) {
        var clientSocket = clients[i].ws;
        if (clients[i]["channel"] == target_channel) {
            //console.log('bang!');
            console.log('multicast to: ' + target_channel);
            if ((clientSocket.readyState === WebSocket.OPEN)) {
                clientSocket.send(JSON.stringify({
                    "channel": clients[i].channel,
                    "id": client_uuid,
                    "nickname": nickname,
                    "message": message
                }));
            }
        } else {
            //console.log('swallow it...');
        }
    }
}

var clientIndex = 1;
//console.log(wss.options.handleProtocols);

wss.on('connection', function(ws) {
    //console.log(Object.keys(ws));
    console.log('on connection, client protocol: ' + ws.protocol)
    if (typeof ws.protocol == 'undefined') {
        console.log('brocast mode')
    }
    var client_uuid = uuid.v4();
    var nickname = "AnonymousUser" + clientIndex;
    var client_protocol = (typeof ws.protocol == 'undefined') ? ws.protocol : 'unicast';
    console.log('set protocol: ' + client_protocol);
    clientIndex += 1;
    client = {
        "id": client_uuid,
        "ws": ws,
        "nickname": nickname,
        "channel": client_protocol
    };
    console.log('client [%s] connected', client.nickname);

    clients.push(client);

    // clients.push({
    //     "id": client_uuid,
    //     "ws": ws,
    //     "nickname": nickname,
    //     "channel": client_protocol
    // });
    //console.log('client [%s] connected', client_uuid);

    var connect_message = nickname + " has connected";
    //wsSend("notification", client_uuid, nickname, connect_message);
    console.log(connect_message);
    wsMulticast(wss.options.handleProtocols, client_uuid, nickname, connect_message);

    ws.on('message', function(message) {
        if (message.indexOf('/nick') === 0) {
            var nickname_array = message.split(' ');
            if (nickname_array.length >= 2) {
                var old_nickname = nickname;
                nickname = nickname_array[1];
                var nickname_message = "Client " + old_nickname + " changed to " + nickname;
                wsSend("nick_update", client_uuid, nickname, nickname_message);
            }
        } else if (message.indexOf('/appstatus') === 0) {
            var app_status_message = {
                "status": "started",
                "cpu": {
                    "utilization": 123,
                    "info": "core i7",
                    "usage": 0.0329
                },
                "memory": {
                    "total": 32000,
                    "used": 16000
                }
            };
            wsSend("appstatus", app_status_message);

        } else {
            //wsSend("message", client_uuid, nickname, message);
            wsMulticast(wss.options.handleProtocols, client_uuid, nickname, message);
        }
    });

    var closeSocket = function(customMessage) {
        for (var i = 0; i < clients.length; i++) {
            if (clients[i].id == client_uuid) {
                var disconnect_message;
                if (customMessage) {
                    disconnect_message = customMessage;
                } else {
                    disconnect_message = nickname + " has disconnected";
                }
                //wsSend("notification", client_uuid, nickname, disconnect_message);
                console.log(disconnect_message);
                clients.splice(i, 1);
            }
        }
    }

    ws.on('close', function() {
        closeSocket();
    });

    process.on('SIGINT', function() {
        console.log("Closing things");
        closeSocket('Server has disconnected');
        process.exit();
    });
});

console.log('Server is listening on port ' + SERVER_PORT);