"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dgram = require("dgram");
const events_1 = require("events");
// region interfaces
var RendezvousProtocol;
(function (RendezvousProtocol) {
    RendezvousProtocol[RendezvousProtocol["UDP"] = 0] = "UDP";
    RendezvousProtocol[RendezvousProtocol["UTP"] = 1] = "UTP";
    RendezvousProtocol[RendezvousProtocol["UDT"] = 2] = "UDT";
    RendezvousProtocol[RendezvousProtocol["TCP"] = 3] = "TCP";
})(RendezvousProtocol = exports.RendezvousProtocol || (exports.RendezvousProtocol = {}));
var MessageType;
(function (MessageType) {
    MessageType[MessageType["PAYLOAD"] = 0] = "PAYLOAD";
    MessageType[MessageType["HANDSHAKE"] = 1] = "HANDSHAKE";
    MessageType[MessageType["HOLEPUNCH"] = 2] = "HOLEPUNCH";
    MessageType[MessageType["ACK"] = 3] = "ACK";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
var HandshakeRequestType;
(function (HandshakeRequestType) {
    HandshakeRequestType[HandshakeRequestType["REGISTRATION"] = 0] = "REGISTRATION";
    HandshakeRequestType[HandshakeRequestType["HOLEPUNCH"] = 1] = "HOLEPUNCH";
})(HandshakeRequestType = exports.HandshakeRequestType || (exports.HandshakeRequestType = {}));
// endregion
/**
 * Class representing a peer
 * @author Marco Moschettini
 * @version 0.0.1
 * @class
 */
class Peer extends events_1.EventEmitter {
    constructor(id, options) {
        super();
        this._id = id;
        this._rendezvous = options.rendezvous;
        this._host = options && options.host || null;
        this._port = options && options.port || null;
        this._retry_interval = options && options.retry || 1000;
        this._protocol = options && options.protocol || RendezvousProtocol.UDP;
        this._connected = false;
        this._socket = dgram.createSocket('udp4');
    }
    /**
     * Method that makes the peer listen on the the given port
     * @returns Promise <any>: resolved when peer has bound to the port
     */
    listen() {
        return new Promise((resolve) => {
            this._socket.on('message', (message, sender) => this._receive(message, sender));
            this._socket.on('error', (error) => {
                this._socket.close();
                this.emit('error', error);
            });
            this._socket.bind(this._port, this._host, () => {
                this._host = this._socket.address().address;
                this._port = this._socket.address().port;
                console.log(`UDP Socket bound on ${this._host}:${this._port}`);
                this._interval = setInterval(() => {
                    let data = JSON.stringify({
                        type: HandshakeRequestType.REGISTRATION,
                        peer: {
                            id: this._id
                        }
                    });
                    this._socket.send(Buffer.from(data), 0, data.length, this._rendezvous.port, this._rendezvous.host);
                }, this._retry_interval);
                return resolve();
            });
        });
    }
    /**
     * Method that sends the handshake request to the rendezvous server
     * @param peer_id {string}: The id of the peer to connect to.
     * @param onconnection
     */
    get_connection_with(peer_id) {
        this._interval = setInterval(() => {
            let data = JSON.stringify({
                type: HandshakeRequestType.HOLEPUNCH,
                remote: peer_id,
                peer: {
                    id: this._id
                }
            });
            this._socket.send(Buffer.from(data), 0, data.length, this._rendezvous.port, this._rendezvous.host);
        }, this._retry_interval);
    }
    // region holepunch
    /**
     * Method that performs a receive when a new message from rendezvous server is received.
     * @param message {string|Buffer}: The received message
     * @param sender {dgram.AddressInfo}: Sender infos
     * @private
     */
    _receive(message, sender) {
        let data;
        try {
            data = JSON.parse(message);
        }
        catch (error) {
            this.emit('error', error);
        }
        switch (data.type) {
            case MessageType.HANDSHAKE:
                {
                    clearInterval(this._interval);
                    this._holepunch(data);
                    break;
                }
            case MessageType.HOLEPUNCH:
                {
                    console.log('Received a punch packet, stopping punch');
                    let data = Buffer.from(JSON.stringify({ type: MessageType.ACK }));
                    console.log('ACK packet sent');
                    this._socket.send(data, 0, data.length, this._remote.port, this._remote.host);
                    break;
                }
            case MessageType.ACK:
                {
                    clearInterval(this._punch_interval);
                    console.log('Received an ACK packet');
                    break;
                }
            default:
                {
                    throw new Error(`Unknown packet received ${data}`);
                }
        }
    }
    /**
     * Method performing the actual holepunch
     * @param remote {Message}: The message to punch through the NAT.
     * @private
     */
    _holepunch(remote) {
        console.log('Response received:', remote, 'Starting holepunch!!');
        this._remote = { id: remote.id, host: remote.host, port: remote.port };
        this._punch_interval = setInterval(() => {
            console.log(`Holepunching on address ${this._remote.host}:${this._remote.port}`);
            let data = Buffer.from(JSON.stringify({ type: MessageType.HOLEPUNCH }));
            this._socket.send(data, 0, data.length, this._remote.port, this._remote.host);
        }, this._retry_interval);
    }
}
exports.Peer = Peer;
//# sourceMappingURL=Peer.js.map