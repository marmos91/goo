import * as dgram from 'dgram';
import * as _ from 'underscore';
import {EventEmitter} from 'events';
import {logger, LoggerInstance} from 'winston-decorator';
import settings from '../settings';

// region interfaces

/**
 * Enum listing the protocol to use for the holepunch
 */
export enum RendezvousProtocol {UDP = 0, TCP}
export enum MessageType {DATA = 0, HANDSHAKE}
export enum HandshakeRequestType {REGISTRATION = 0, HOLEPUNCH}

/**
 * @member port {number}: (optional) specifies the port to listen onto
 * @member host {string}: (optional) specifies the hosts to filter when listening
 * @member protocol {UDP | TCP}: (optional) specifies the protocol to use for the handshake
 */
export interface RendezvousOptions
{
    port?: number;
    host?: string;
    protocol?: RendezvousProtocol;
}

/**
 * Interface representing a single peer requesting an handshake
 */
export interface Peer
{
    id: string;
    host?: string;
    port?: number;
}

export interface HandshakeRequest
{
    type: HandshakeRequestType;
    peer?: Peer;
    remote?: string;
}

export interface Message
{
    id: string;
    host: string;
    port: number;
    type: MessageType;
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
        this._socket.on('message', (message, sender) => this._on_message(message, sender));
    }

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

    private _on_message(message: string | Buffer, sender: dgram.AddressInfo)
    {
        try
        {
            let request: HandshakeRequest = JSON.parse(message as string);

            this._logger.debug('Message received', request);

            switch(request.type)
            {
                case HandshakeRequestType.REGISTRATION:
                {
                    if(request.peer.id)
                    {
                        request.peer.host = sender.address;
                        request.peer.port = sender.port;
                        this._peers[request.peer.id] = request.peer;
                        this._logger.debug('Peer registered', request.peer);
                    }

                    break;
                }
                case HandshakeRequestType.HOLEPUNCH:
                {
                    if(request.remote)
                    {
                        this._logger.debug('Received an handshake request for a peer');
                        if(this._peers[request.remote])
                        {
                            this._logger.debug('Received an handshake request for an online peer');

                            let sender_response: Message = _.pick(this._peers[request.remote], 'id', 'host', 'port');
                            sender_response.type = MessageType.HANDSHAKE;

                            let receiver_response: Message = {
                                type: MessageType.HANDSHAKE,
                                id: request.peer.id,
                                host: sender.address,
                                port: sender.port
                            };

                            let sender_message = JSON.stringify(sender_response);
                            let receiver_message = JSON.stringify(receiver_response);

                            this._logger.debug('Sending back handshake response', sender_response);

                            this._socket.send(receiver_message, 0, receiver_message.length, sender_response.port, sender_response.host);
                            this._socket.send(sender_message, 0, sender_message.length, sender.port, sender.address);
                        }
                        else
                            this._logger.error('Peer not yet registered');
                    }
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
}
