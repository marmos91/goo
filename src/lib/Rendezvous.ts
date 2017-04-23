import * as dgram from 'dgram';
import {EventEmitter} from 'events';
import {logger, LoggerInstance} from 'winston-decorator';
import settings from '../settings';
import Address from './Address';
import {HandshakeRequest, HandshakeRequestType, Message, MessageType} from './Requests';

// region interfaces

/**
 * Interface used to specify the server-related options
 * @member port {number}: (optional) specifies the port to listen onto
 * @member host {string}: (optional) specifies the hosts to filter when listening
 * @member protocol {UDP | TCP}: (optional) specifies the protocol to use for the handshake
 */
export interface RendezvousOptions
{
    port?: number;
    host?: string;
    protocol?: ProtocolType;
}

/**
 * Private interface used to define a Peer on the signaling server.
 */
interface Peer
{
    id: string;
    endpoint: Address;
}

export enum ProtocolType {UTP, WEBRTC}

// endregion

/**
 * Class representing a Rendezvous server. This server is used as a signaling server to perform a NAT-traversal
 * connection.
 * @author Marco Moschettini
 * @version 0.0.1
 * @implements EventEmitter
 * @class
 */
export class Rendezvous
{
    @logger(settings)
    private _logger: LoggerInstance;

    private _port: number;
    private _host: string;
    private _socket: dgram.Socket;
    private _peers: Peer [];
    private _protocol: ProtocolType;

    public constructor(options?: RendezvousOptions)
    {
        this._port = options && options.port || 4321;
        this._host = options && options.host || null;
        this._protocol = (options && typeof options.protocol !== 'undefined') ? options.protocol : ProtocolType.WEBRTC;
        this._peers = [];

        this._logger.debug('Protocol chosen:', ProtocolType[this._protocol]);

        this._socket = dgram.createSocket('udp4');
        this._socket.on('error', (error) =>
        {
            this._logger.error(error.message);
            this._socket.close();
        });
        this._socket.on('message', (message, sender) => this._multiplex(message, new Address(sender.address, sender.port)));
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
     * Method used to multiplex the just received message to one of the specific method below.
     * @param message {string | Buffer} The message to multiplex
     * @param sender {Address} The address of the sender
     * @private
     */
    private _multiplex(message: string | Buffer, sender: Address)
    {
        try
        {
            let request: HandshakeRequest = JSON.parse(message as string);

            switch(request.type)
            {
                case HandshakeRequestType.REGISTRATION:
                {
                    this._logger.verbose('Registration request received.');
                    this._register_peer(request, sender);
                    break;
                }
                case HandshakeRequestType.HOLEPUNCH:
                {
                    this._logger.verbose('Handshake request received.');
                    this._handshake(request, sender);
                    break;
                }
                case HandshakeRequestType.SIGNALING:
                {
                    this._logger.verbose('Signaling request received.');
                    this._signal(request);
                    break;
                }
                default:
                {
                    this._logger.error('Unknown request received');
                }
            }
        }
        catch(error)
        {
            this._logger.error(error);
        }
    }

    // endregion

    // region peer registration

    /**
     * Private method used to save a peer on the server. It is continuously called as a keep-alive
     * @param request {HandshakeRequest} The request to save.
     * @param sender {Address} The sender of the request
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
     * Method used to perform an handshake between two peers behind NATs.
     * @param request {HandshakeRequest} The handshake request.
     * @param sender {Address} Address of the requesting peer.
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

                let receiver_response: Message = {
                    type: MessageType.HANDSHAKE,
                    id: request.peer_id,
                    endpoint: sender
                };

                let receiver_message = JSON.stringify(receiver_response);
                this._send(receiver_message, this._peers[request.remote_id].endpoint);

                if(this._protocol === ProtocolType.UTP)
                {
                    let sender_response: Message = {
                        type: MessageType.HANDSHAKE,
                        id: request.remote_id,
                        endpoint: this._peers[request.remote_id].endpoint
                    };

                    let sender_message = JSON.stringify(sender_response);
                    this._send(sender_message, sender);
                }
            }
            else
                this._logger.error('Peer', request.remote_id, 'not yet registered');
        }
    }

    /**
     *
     * @param request
     * @private
     */
    private _signal(request: HandshakeRequest)
    {
        this._logger.debug('Signaling ice candidates...');
        if(request.remote_id)
        {
            let message: Message = {
                type: MessageType.SIGNAL,
                body: request.signal
            };

            this._send(JSON.stringify(message), this._peers[request.remote_id].endpoint);
        }
    }

    // endregion

    // region utilities

    /**
     * Utility method which wraps the low-level udp send to provide a more simple interface.
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
