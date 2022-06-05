const CLIENT_ID_EVENT = 'client-id-event';
const OFFER_EVENT = 'offer-event';
const SHARE_SCREEN_EVENT = 'share-screen-event';
const ANSWER_EVENT = 'answer-event';
const ICE_CANDIDATE_EVENT = 'ice-candidate-event';

var socketMain = {
  clientList: {},
  roomList: [],
  initLoad: function(server) {
    var io = require('socket.io').listen(server);
    socketMain.connection(io);
  },
  connection: function(io) {
    io.on('connection', function(socket) {
      console.log('Connect success!');
      socketMain.clientList[socket.id] = socket;
      socket.emit(CLIENT_ID_EVENT, socket.id);

      socketMain.onOfferEvent(socket);
      socketMain.onShareScreenEvent(socket);
      socketMain.onAnswerEvent(socket);
      socketMain.onIceCandidateEvent(socket);
      socketMain.disconnect(socket);
    });
  },
  disconnect: function(socket) {
    socket.on('disconnect', function(socket) {
      console.log('Disconnect !');
      delete socketMain.clientList[socket.id];
      for (let i = 0; i < socketMain.roomList.length; i++) {
        if (
          socketMain.roomList[i].host == socket.id ||
          socketMain.roomList[i].peer == socket.id
        ) {
          socketMain.roomList.splice(i, 1);
        }
      }
    });
  },
  findPeerId: function(hostId) {
    for (let i = 0; i < this.roomList.length; i++) {
      if (socketMain.roomList[i].host == hostId) {
        return socketMain.roomList[i].peer;
      }
    }
  },
  findHostId: function(peerId) {
    for (let i = 0; i < socketMain.roomList.length; i++) {
      if (socketMain.roomList[i].peer == peerId) {
        return socketMain.roomList[i].host;
      }
    }
  },
  onOfferEvent: function(socket) {
    socket.on(OFFER_EVENT, function(data) {
      socketMain.roomList.push({ host: socket.id, peer: data.peerId });
      const peer = socketMain.clientList[data.peerId];
      if (peer) {
        peer.emit(OFFER_EVENT, data.description);
      } else {
        console.log('onOfferEvent: Peer does not found');
      }
    });
  },
  onShareScreenEvent: function(socket) {
    socket.on(SHARE_SCREEN_EVENT, function(data) {
      const peer = socketMain.clientList[data.peerId];
      if (peer) {
        peer.emit(SHARE_SCREEN_EVENT, data.description);
      } else {
        console.log('SHARE_SCREEN_EVENT: Peer does not found');
      }
    });
  },
  onAnswerEvent: function(socket) {
    socket.on(ANSWER_EVENT, function(data) {
      const hostId = socketMain.findHostId(socket.id);
      const host = socketMain.clientList[hostId];
      if (host) {
        host.emit(ANSWER_EVENT, data.description);
      } else {
        console.log('onAnswerEvent: Host does not found');
      }
    });
  },
  onIceCandidateEvent: function(socket) {
    socket.on(ICE_CANDIDATE_EVENT, function(data) {
      let clientId;
      if (data.isHost) {
        clientId = socketMain.findPeerId(socket.id);
      } else {
        clientId = socketMain.findHostId(socket.id);
      }
      const peer = socketMain.clientList[clientId];
      if (peer) {
        peer.emit(ICE_CANDIDATE_EVENT, data.candidate);
      } else {
        console.log('onIceCandidateEvent: Peer does not found');
      }
    });
  },
};

module.exports = socketMain;
