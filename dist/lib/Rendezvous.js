"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dgram = require("dgram");
const _ = require("underscore");
const events_1 = require("events");
// region interfaces
/**
 * Enum listing the protocol to use for the holepunch
 */
var RendezvousProtocol;
(function (RendezvousProtocol) {
    RendezvousProtocol[RendezvousProtocol["UDP"] = 0] = "UDP";
    RendezvousProtocol[RendezvousProtocol["TCP"] = 1] = "TCP";
})(RendezvousProtocol = exports.RendezvousProtocol || (exports.RendezvousProtocol = {}));
var MessageType;
(function (MessageType) {
    MessageType[MessageType["DATA"] = 0] = "DATA";
    MessageType[MessageType["HANDSHAKE"] = 1] = "HANDSHAKE";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
var HandshakeRequestType;
(function (HandshakeRequestType) {
    HandshakeRequestType[HandshakeRequestType["REGISTRATION"] = 0] = "REGISTRATION";
    HandshakeRequestType[HandshakeRequestType["HOLEPUNCH"] = 1] = "HOLEPUNCH";
})(HandshakeRequestType = exports.HandshakeRequestType || (exports.HandshakeRequestType = {}));
// endregion
/**
 * @author Marco Moschettini
 * @version 0.0.1
 * @implements EventEmitter
 * @class
 */
class Rendezvous extends events_1.EventEmitter {
    constructor(options) {
        super();
        this._port = options && options.port || 4321;
        this._host = options && options.host || null;
        this._peers = [];
        this._socket = dgram.createSocket('udp4');
        this._socket.on('error', (error) => {
            this._socket.close();
            this.emit('error', error);
        });
        this._socket.on('message', (message, sender) => this._on_message(message, sender));
    }
    /**
     * Method that makes the server listening on the provided host and port.
     * @returns Promise <any>: resolved when server has bound to the port
     */
    listen() {
        return new Promise((resolve) => {
            this._socket.on('listening', resolve);
            this._socket.bind(this._port, this._host);
        });
    }
    _on_message(message, sender) {
        try {
            let request = JSON.parse(message);
            console.log('Message received', request);
            switch (request.type) {
                case HandshakeRequestType.REGISTRATION:
                    {
                        if (request.peer.id) {
                            request.peer.host = sender.address;
                            request.peer.port = sender.port;
                            this._peers[request.peer.id] = request.peer;
                            console.log('Peer registered', request.peer);
                        }
                        break;
                    }
                case HandshakeRequestType.HOLEPUNCH:
                    {
                        if (request.remote) {
                            console.log('Received an handshake request for a peer');
                            if (this._peers[request.remote]) {
                                console.log('Received an handshake request for an online peer');
                                let sender_response = _.pick(this._peers[request.remote], 'id', 'host', 'port');
                                sender_response.type = MessageType.HANDSHAKE;
                                let receiver_response = {
                                    type: MessageType.HANDSHAKE,
                                    id: request.peer.id,
                                    host: sender.address,
                                    port: sender.port
                                };
                                let sender_message = JSON.stringify(sender_response);
                                let receiver_message = JSON.stringify(receiver_response);
                                console.log('Sending back handshake response', sender_response);
                                this._socket.send(receiver_message, 0, receiver_message.length, sender_response.port, sender_response.host);
                                this._socket.send(sender_message, 0, sender_message.length, sender.port, sender.address);
                            }
                            else
                                console.error('Peer not yet registered');
                        }
                        break;
                    }
                default:
                    {
                        this.emit('error', new Error('Unknown request received'));
                    }
            }
        }
        catch (error) {
            this.emit('error', error);
        }
    }
}
exports.Rendezvous = Rendezvous;
//# sourceMappingURL=Rendezvous.js.map