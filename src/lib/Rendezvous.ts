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
 */
export interface RendezvousOptions
{
    port?: number;
    host?: string;
}

interface Peer
{
    id: string;
    endpoint: Address;
}

// endregion

/**
 * @author Marco Moschettini
 * @version 0.0.1
 * @implements EventEmitter
 * @class
 */
export class Rendezvous extends EventEmitter
{
    @logger(settings)
    private _logger: LoggerInstance;

    private _port: number;
    private _host: string;
    private _socket: dgram.Socket;
    private _peers: Peer [];

    public constructor(options?: RendezvousOptions)
    {
        super();
        this._port = options && options.port || 4321;
        this._host = options && options.host || null;
        this._peers = [];

        this._socket = dgram.createSocket('udp4');
        this._socket.on('error', (error) =>
        {
            this._socket.close();
            this.emit('error', error);
        });
        this._socket.on('message', (message, sender) => this._on_message(message, new Address(sender.address, sender.port)));
    }

    // region initializing

    /**
     * Method that makes the server listening on the provided host and port.
     * @returns Promise <any>: resolved when server has bound to the port
     */
    public listen(): Promise<any>
    {
        return new Promise((resolve) =>
        {
            this._socket.on('listening', resolve);
            this._socket.bind(this._port, this._host);
        });
    }

    // endregion

    // region multiplexing
    /**
     *
     * @param message
     * @param sender
     * @private
     */
    private _on_message(message: string | Buffer, sender: Address)
    {
        try
        {
            let request: HandshakeRequest = JSON.parse(message as string);
            this._logger.debug('Message received', request);

            switch(request.type)
            {
                case HandshakeRequestType.REGISTRATION:
                {
                    this._register_peer(request, sender);
                    break;
                }
                case HandshakeRequestType.HOLEPUNCH:
                {
                    this._handshake(request, sender);
                    break;
                }
                default:
                {
                    this.emit('error', new Error('Unknown request received'));
                }
            }
        }
        catch(error)
        {
            this.emit('error', error);
        }
    }

    // endregion

    // region peer registration
    /**
     *
     * @param request
     * @param sender
     * @private
     */
    private _register_peer(request: HandshakeRequest, sender: Address)
    {
        if(request.peer_id)
        {
            this._peers[request.peer_id] = {
                id: request.peer_id,
                endpoint: sender
            };
            this._logger.debug('Peer registered', request.peer_id);
        }
    }

    // endregion

    // region signaling
    /**
     *
     * @param request
     * @param sender
     * @private
     */
    private _handshake(request: HandshakeRequest, sender: Address)
    {
        if(request.remote_id)
        {
            this._logger.debug('Received an handshake request for peer', request.remote_id);
            if(this._peers[request.remote_id])
            {
                this._logger.debug('Received an handshake request for an online peer');

                let sender_response: Message = {
                    type: MessageType.HANDSHAKE,
                    id: request.remote_id,
                    endpoint: this._peers[request.remote_id].endpoint
                };

                let receiver_response: Message = {
                    type: MessageType.HANDSHAKE,
                    id: request.peer_id,
                    endpoint: sender
                };

                let sender_message = JSON.stringify(sender_response);
                let receiver_message = JSON.stringify(receiver_response);

                this._logger.debug('Sending back handshake response', sender_response);

                this._send(receiver_message, this._peers[request.remote_id].endpoint);
                this._send(sender_message, sender);
            }
            else
                this._logger.error('Peer', request.remote_id, 'not yet registered');
        }
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
