/**
 * WebSocket Multicast by Subprotocol Example
 *
 *  Server usage:
 *    node server.js
 *
 *  Client usage:
 *  - 1. Simply use wscat (npm install -g wscat)
 *    # wscat -c "ws://localhost:6789" -s "chat_room_001"
 *  - 2. var device = new WebSocket('ws://localhost:8080', 'chat_room_001');
 *
 *  Copyright(c) 2016 Jimmy Liao <sjliaogmail.com>
 *  Date: 2016/06/04
 *  MIT Licensed
 */



/**
 * To avoid potential collision, it is recommended
 * to use names that contain the ASCII version of
 * the domain name of the subprotocol's originator.
 *      -- https://tools.ietf.org/html/rfc6455#section-1.9
 */
var protocols = {
  'meeting_01': {
    messageHandler: function(meeting_01) {
      return function(data) {
        console.log('data: ' + data);
        //meeting_01.send('recieved ' + data + ' from meeting_01');

        //echo
        meeting_01.send(data);
        //users[data.userName].send(data);
      };
    }
  },

  'device.example.com': {
    messageHandler: function(device) {
      return function(data) {
        device.send('recieved ' + data + ' from device');
      };
    }
  },

  'screen.example.com': {
    messageHandler: function(screen) {
      return function(data) {
        screen.send('recieved ' + data + ' from screen');
      };
    }
  }
};

/**
 * Don't accept communication for an unsupported
 * protocol. The protocol is defined in the handshake of
 * the client in form of a HTTP header such as
 * |Sec-WebSocket-Protocol|.
 *      -- https://tools.ietf.org/html/rfc6455#section-1.9
 */
function protocolHandler(recievedProtocols, cb) {
  var protocol = '';
  recievedProtocols.forEach(function(p) {
    if (Object.keys(protocols).indexOf(p) > -1 && !protocol) {
      protocol = p;
    }
  });
  cb(!!protocol, protocol);
}

var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;
//wss = new WebSocketServer({port: 8181});
//var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
  port: 8080,
  //handleProtocols: protocolHandler
  handleProtocols: "meeting_room_101"
});
var uuid = require('node-uuid');

var clients = [];

function wsSend(type, client_uuid, nickname, message) {
  for (var i = 0; i < clients.length; i++) {
    //console.log(Object.keys(clients[i]));
    var clientSocket = clients[i].ws;
    console.log('channel: ' + clients[i].channel);
    if ( (clientSocket.readyState === WebSocket.OPEN) ){
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
    if (clients[i]["id"] == client_uuid){
      console.log('originator channe: ' + clients[i]["channel"]);
      target_channel = clients[i]["channel"];
        break;
    } else {
      //
    }
  }


  console.log('target channel changed: ' + target_channel);
/////

  var client_group = [];

  for (var i = 0; i < clients.length; i++) {
    var clientSocket = clients[i].ws;
    if (clients[i]["channel"] == target_channel){
      //console.log('bang!');
      console.log('multicast to: ' + target_channel);
        if ( (clientSocket.readyState === WebSocket.OPEN) ){
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
  var client_uuid = uuid.v4();
  var nickname = "AnonymousUser" + clientIndex;
  var client_protocol = (ws.protocol)?ws.protocol:'unicast';
  console.log('set protocol: ' + client_protocol);
  clientIndex += 1;
  clients.push({
    "id": client_uuid,
    "ws": ws,
    "nickname": nickname,
    "channel": client_protocol
  });
  console.log('client [%s] connected', client_uuid);
  var connect_message = nickname + " has connected";
  //wsSend("notification", client_uuid, nickname, connect_message);
  ws.on('message', function(message) {
    if (message.indexOf('/nick') === 0) {
      var nickname_array = message.split(' ');
      if (nickname_array.length >= 2) {
        var old_nickname = nickname;
        nickname = nickname_array[1];
        var nickname_message = "Client " + old_nickname + " changed to " + nickname;
        wsSend("nick_update", client_uuid, nickname, nickname_message);
      }
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
        wsSend("notification", client_uuid, nickname, disconnect_message);
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

// wss.on('connection', function(client) {
//   console.log('client connected. ' + Object.keys(client));
//   //client.on('message', protocols[client.protocol].messageHandler(client));
//   client.on('message', protocols[client.protocol].messageHandler(client));
// });

// wss.broadcast = function broadcast(data) {
//   wss.clients.forEach(function each(client) {
//     client.send(data);
//    });
// };
