import * as dgram from 'dgram';
import {EventEmitter} from 'events';
import * as SPeer from 'simple-peer';
import {logger, LoggerInstance} from 'winston-decorator';
import * as wrtc from 'wrtc';
import settings from '../settings';
import Address from './Address';
import {HandshakeRequest, HandshakeRequestType, Message, MessageType} from './Requests';

// region settings
let ice_settings = {
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
        this._host = options && options.host || null;
        this._port = options && options.port || null;
        this._retry_interval = options && options.retry || 1000;
        this._trickle = options && options.trickle || true;
        this._intervals = {
            handshake: null,
            registration: null,
            punch: null
        };

        this._socket = dgram.createSocket('udp4');
    }

    // region public methods

    /**
     * Method that sends the handshake request to the rendezvous server
     * @param remote_id {string}: The id of the peer to connect to.
     */
    public get_connection_with(remote_id: string)
    {
        this._logger.debug('Establishing WebRTC connection with peer', remote_id);

        let data: HandshakeRequest = {
            type: HandshakeRequestType.HOLEPUNCH,
            peer_id: this._id,
            remote_id
        };

        let buffered_data = Buffer.from(JSON.stringify(data));
        this._send(buffered_data, this._rendezvous);

        this._peer = new SPeer({initiator: true, wrtc, config: ice_settings, trickle: this._trickle});

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
                    this._logger.verbose('Handshake request received. Starting holepunch!');

                    this._peer = new SPeer({initiator: false, wrtc, config: ice_settings, trickle: this._trickle});

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
