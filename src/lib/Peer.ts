import {EventEmitter} from 'events';
import * as SPeer from 'simple-peer';
import {logger, LoggerInstance} from 'winston-decorator';
import * as wrtc from 'wrtc';
import settings from '../settings';
import Address from './Address';
import {HandshakeRequest, HandshakeRequestType, Message, MessageType, ProtocolType} from './Requests';
const utp = require('utp-native');

// region settings
let default_ice_settings = {
    iceServers: [{
        url: 'stun:stun.l.google.com:19302'
    }],
    iceTransportPolicy: 'all',
    rtcpMuxPolicy: 'negotiate'
};
// endregion

// region interfaces

/**
 * Interface representing all the possible Peer options regarding the rendezvous server
 * @member port {number}: (optional) specifies the port to listen onto
 * @member host {string}: (optional) specifies the hosts to filter when listening
 * @member protocol {UDP | TCP}: (optional) specifies the protocol to use for the handshake
 * @member retry {number}: The retry interval for the holepunch
 */
export interface RendezvousOptions
{
    rendezvous: Address;
    initiator?: boolean;
    protocol?: ProtocolType;
    port?: number;
    host?: string;
    retry?: number;
    trickle?: boolean;
}

// endregion

/**
 * Class representing a peer
 * @author Marco Moschettini
 * @version 0.0.1
 * @class
 */
export class Peer extends EventEmitter
{
    @logger(settings)
    private _logger: LoggerInstance;

    // region properties
    private _id: string;
    private _host: string;
    private _port: number;
    private _initiator: boolean;
    private _protocol: ProtocolType;

    private _rendezvous: Address;
    private _remote: {
        id: string,
        endpoint: Address
    };

    private _peer: SPeer.Instance;
    private _socket: any;
    private _retry_interval: number;
    private _trickle: boolean;
    private _intervals: {
        handshake: NodeJS.Timer,
        registration: NodeJS.Timer,
        punch: NodeJS.Timer
    };

    // endregion

    public constructor(id: string, options: RendezvousOptions)
    {
        super();
        this._id = id;
        this._rendezvous = options.rendezvous;
        this._initiator = options && options.initiator || false;
        this._protocol = (typeof options !== 'undefined') ? options.protocol : ProtocolType.WEBRTC;
        this._host = options && options.host || null;
        this._port = options && options.port || null;
        this._retry_interval = options && options.retry || 1000;
        this._trickle = options && options.trickle || true;
        this._intervals = {
            handshake: null,
            registration: null,
            punch: null
        };

        this._logger.debug('Protocol chosen:', ProtocolType[this._protocol]);
        this._socket = utp();
    }

    // region connection factory

    /**
     * Method that sends the handshake request to the rendezvous server
     * @param remote_id {string}: The id of the peer to connect to.
     */
    public get_connection_with(remote_id: string)
    {
        this._logger.debug('Establishing connection with peer', remote_id);

        switch(this._protocol)
        {
            case ProtocolType.UTP:
            {
                this._utp_setup(remote_id);
                break;
            }
            case ProtocolType.WEBRTC:
            {
                this._rtc_setup(remote_id);
                break;
            }
            default:
            {
                this.emit('error', new Error('Unknown protocol specified'));
            }
        }
    }

    /**
     *
     * @param remote_id
     * @private
     */
    private _utp_setup(remote_id: string)
    {
        this._logger.debug('Setting up UTP');
        this._intervals.handshake = setInterval(() =>
        {
            let data: HandshakeRequest = {
                type: HandshakeRequestType.HOLEPUNCH,
                peer_id: this._id,
                remote_id
            };

            let buffered_data = Buffer.from(JSON.stringify(data));

            this._send(buffered_data, this._rendezvous);
        }, this._retry_interval);
    }

    /**
     *
     * @param remote_id
     * @private
     */
    private _rtc_setup(remote_id: string)
    {
        this._logger.debug('Setting up WebRTC');
        let data: HandshakeRequest = {
            type: HandshakeRequestType.HOLEPUNCH,
            peer_id: this._id,
            remote_id
        };

        let buffered_data = Buffer.from(JSON.stringify(data));
        this._send(buffered_data, this._rendezvous);

        this._peer = new SPeer({initiator: true, wrtc, config: default_ice_settings, trickle: this._trickle});

        this._peer.on('error', (error) => this.emit('error', error));
        this._peer.on('connect', () => this.emit('connection', this._peer));

        this._logger.debug('Retrieving ICE candidates...');
        this._peer.on('signal', (ice_candidate) =>
        {
            let request: HandshakeRequest = {
                type: HandshakeRequestType.SIGNALING,
                peer_id: this._id,
                signal: ice_candidate,
                remote_id
            };

            this._logger.silly('Sending ice candidates...', ice_candidate);
            let signal = Buffer.from(JSON.stringify(request));
            this._send(signal, this._rendezvous);
        });
    }

    // endregion

    // region initialization

    /**
     * Method that makes the peer listen on the the given port
     * @returns Promise <any>: resolved when peer has bound to the port
     */
    public listen(): Promise<any>
    {
        return new Promise((resolve) =>
        {
            this._socket.bind(this._port, this._host, async () =>
            {
                // Save socket info
                this._host = this._socket.address().address;
                this._port = this._socket.address().port;
                this._logger.debug(`UDP Socket bound on ${this._host}:${this._port}`);

                await this._init();
                await this._register();
                return resolve();
            });
        });
    }

    /**
     * Private method which initialize all the socket-related options
     * @returns {Promise<T>}
     * @private
     */
    private _init(): Promise<any>
    {
        return new Promise((resolve, reject) =>
        {
            this._socket.on('error', (error) =>
            {
                if(error)
                {
                    this._socket.close();
                    return reject();
                }
            });

            this._socket.on('message', (message, sender) => this._multiplex(message, new Address(sender.address, sender.port)));

            this._logger.debug('Socket set up');
            return resolve();
        });
    }

    /**
     * Private method used to register the peer to the given rendezvous server.
     * @private
     */
    private _register(): Promise<any>
    {
        switch(this._protocol)
        {
            case ProtocolType.UTP:
            {
                return this._utp_register();
            }
            case ProtocolType.WEBRTC:
            {
                return this._rtc_register();
            }
            default:
            {
                this.emit('error', new Error('Unknown protocol specified'));
            }
        }
    }

    /**
     *
     * @returns {Promise<T>}
     * @private
     */
    private _utp_register(): Promise <any>
    {
        return new Promise((resolve, reject) =>
        {
            this._intervals.registration = setInterval(() =>
            {
                try
                {
                    let request: HandshakeRequest = {type: HandshakeRequestType.REGISTRATION, peer_id: this._id};
                    let buffer_request = Buffer.from(JSON.stringify(request));

                    this._send(buffer_request, this._rendezvous);

                    return resolve();
                }
                catch(error)
                {
                    this._logger.error(error);
                }
            }, this._retry_interval);
        });
    }

    /**
     *
     * @returns {Promise<T>}
     * @private
     */
    private _rtc_register(): Promise <any>
    {
        return new Promise((resolve, reject) =>
        {
            this._logger.debug('Registering...');

            let request: HandshakeRequest = {type: HandshakeRequestType.REGISTRATION, peer_id: this._id};
            let buffer_request = Buffer.from(JSON.stringify(request));
            this._send(buffer_request, this._rendezvous);

            this._logger.debug('Registered');
            return resolve();
        });
    }

    // endregion

    // region multiplexing

    /**
     * Method used to multiplex all the different message that can be received by the peer.
     * @param message {string | Buffer} The message to be multiplexed
     * @param sender {Address} The sender
     * @private
     */
    private _multiplex(message: string | Buffer, sender: Address)
    {
        try
        {
            let data: Message = JSON.parse(message.toString());
            this._logger.silly('New message received from', sender);

            switch(data.type)
            {
                case MessageType.HANDSHAKE:
                {
                    switch(this._protocol)
                    {
                        case ProtocolType.WEBRTC:
                        {
                            this._rtc_handshake(data);
                            break;
                        }
                        case ProtocolType.UTP:
                        {
                            this._utp_handshake(data);
                            break;
                        }
                        default:
                        {
                            this.emit('error', new Error('Unknown protocol specified'));
                            break;
                        }
                    }
                    break;
                }
                case MessageType.HOLEPUNCH:
                {
                    this._logger.debug('Received holepunch packet from', sender, '. Sending ACK back!');
                    this._send(Buffer.from(JSON.stringify({type: MessageType.ACK})), sender);
                    break;
                }
                case MessageType.ACK:
                {
                    this._logger.debug('Received ack from', sender, 'Stopping timer');
                    if(this._intervals.punch)
                        clearInterval(this._intervals.punch);

                    this._logger.profile('holepunch');

                    this._socket.on('connection', (connection) =>
                    {
                        let callback = (msg) =>
                        {
                            connection.write('ack');
                            this.emit('connection', connection);
                        };
                        connection.once('data', callback);
                    });

                    if(this._initiator)
                    {
                        this._logger.verbose('I am the initiator. Connecting with UTP...');

                        let interval = setInterval(() =>
                        {
                            this._logger.debug('Trying connecting...');
                            let connection = this._socket.connect(sender.port, sender.address);

                            connection.write('punch');
                            let callback = (msg) =>
                            {
                                if(msg.toString() === 'ack')
                                {
                                    clearInterval(interval);
                                    this.emit('connection', connection);
                                }
                            };
                            connection.once('data', callback);
                            connection.read(0);
                        }, this._retry_interval);
                    }
                    else
                        this._logger.verbose('I am the receiver. Listening with UTP...');

                    break;
                }
                case MessageType.SIGNAL:
                {
                    this._logger.silly('Received ice candidates', data.body);
                    this._peer.signal(data.body);
                    break;
                }
                default:
                {
                    this._logger.error('Unknown packet received', data);
                }
            }
        }
        catch(error)
        {
            this._logger.error(error);
        }
    }

    /**
     *
     * @private
     */
    private _rtc_handshake(data: Message)
    {
        this._logger.verbose('Handshake request received. Starting holepunch!');

        this._peer = new SPeer({initiator: false, wrtc, config: default_ice_settings, trickle: this._trickle});

        this._peer.on('error', (error) => this.emit('error', error));
        this._peer.on('connect', () => this.emit('connection', this._peer));

        this._logger.debug('Retrieving ICE candidates...');
        this._peer.on('signal', (ice_candidate) =>
        {
            let request: HandshakeRequest = {
                type: HandshakeRequestType.SIGNALING,
                peer_id: this._id,
                remote_id: data.id,
                signal: ice_candidate
            };

            this._logger.silly('Sending ice candidates...', ice_candidate);
            let signal = Buffer.from(JSON.stringify(request));
            this._send(signal, this._rendezvous);
        });
    }

    /**
     *
     * @private
     */
    private _utp_handshake(data: Message)
    {
        if(this._intervals.handshake)
            clearInterval(this._intervals.handshake);

        if(this._intervals.registration)
            clearInterval(this._intervals.registration);

        this._logger.verbose('Handshake request/response received. Starting holepunch!');

        this._logger.profile('holepunch', 'Holepunch succeeded');
        this._holepunch(data.id, Address.refresh(data.endpoint as any));
    }

    /**
     * Method used to holepunch a packet through the NAT
     * @param id {string} the peer id to connect to
     * @param remote {Address} The remote address
     * @private
     */
    private _holepunch(id: string, remote: Address)
    {
        this._remote = {id, endpoint: remote};

        this._intervals.punch = setInterval(() =>
        {
            this._logger.debug('Holepunching on', this._remote);

            let data = Buffer.from(JSON.stringify({type: MessageType.HOLEPUNCH}));

            this._send(data, remote);
        }, this._retry_interval);
    }

    // endregion

    // region utilities

    /**
     * Utility method which wraps the low-level udp send to provide a more simple interface.
     * @param data {string | Buffer} The data to be sent
     * @param remote {Address} The remote address to send the data to
     * @private
     */
    private _send(data: string | Buffer, remote: Address)
    {
        this._socket.send(data, 0, data.length, remote.port, remote.address as string);
    }

    // endregion
}
