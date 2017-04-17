import * as dgram from 'dgram';
import {EventEmitter} from 'events';
import {logger, LoggerInstance} from 'winston-decorator';
import settings from '../settings';
import Address from './Address';
import {HandshakeRequest, HandshakeRequestType, Message, MessageType} from './Requests';

// region interfaces

/**
 * @member port {number}: (optional) specifies the port to listen onto
 * @member host {string}: (optional) specifies the hosts to filter when listening
 * @member protocol {UDP | TCP}: (optional) specifies the protocol to use for the handshake
 * @member retry {number}: The retry interval for the holepunch
 */
export interface RendezvousOptions
{
    rendezvous: Address;
    port?: number;
    host?: string;
    retry?: number;
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

    private _rendezvous: Address;
    private _remote: {
        id: string,
        endpoint: Address
    };

    private _socket: dgram.Socket;
    private _retry_interval: number;
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
        this._host = options && options.host || null;
        this._port = options && options.port || null;
        this._retry_interval = options && options.retry || 1000;
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
     * @param peer_id {string}: The id of the peer to connect to.
     */
    public get_connection_with(peer_id: string)
    {
        this._intervals.handshake = setInterval(() =>
        {
            let data: HandshakeRequest = {
                type: HandshakeRequestType.HOLEPUNCH,
                remote_id: peer_id,
                peer_id: this._id
            };

            let buffered_data = Buffer.from(JSON.stringify(data));

            this._send(buffered_data, this._rendezvous);
        }, this._retry_interval);
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

                this._register();
                return resolve();
            });
        });
    }

    /**
     *
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

            this._socket.on('message', (message, sender) => this._receive(message, new Address(sender.address, sender.port)));

            this._logger.debug('Socket set up');
            return resolve();
        });
    }

    /**
     *
     * @private
     */
    private _register()
    {
        this._intervals.registration = setInterval(() =>
        {
            try
            {
                let request: HandshakeRequest = {type: HandshakeRequestType.REGISTRATION, peer_id: this._id};
                let buffer_request = Buffer.from(JSON.stringify(request));
                this._send(buffer_request, this._rendezvous);
            }
            catch(error)
            {
                this._logger.error(error);
            }
        }, this._retry_interval);
    }

    // endregion

    // region multiplexing

    /**
     *
     * @param message
     * @param sender
     * @private
     */
    private _receive(message: string | Buffer, sender: Address)
    {
        try
        {
            let data: Message = JSON.parse(message.toString());
            this._logger.debug('New message received from', sender);

            switch(data.type)
            {
                case MessageType.HANDSHAKE:
                {
                    if(this._intervals.handshake)
                        clearInterval(this._intervals.handshake);

                    if(this._intervals.registration)
                        clearInterval(this._intervals.registration);

                    this._logger.debug('Handshake request/response received. Starting holepunch!');
                    this._holepunch(data.id, Address.refresh(data.endpoint as any));
                    break;
                }
                case MessageType.HOLEPUNCH:
                {
                    this._logger.debug('Received holepunch packet from', sender);
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

    // region holepunch

    /**
     *
     * @param id
     * @param remote
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
     *
     * @param data
     * @param remote
     * @private
     */
    private _send(data: string | Buffer, remote: Address)
    {
        this._socket.send(data, 0, data.length, remote.port, remote.address as string);
    }

    // endregion
}
