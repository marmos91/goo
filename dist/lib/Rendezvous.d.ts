/// <reference types="node" />
import { EventEmitter } from 'events';
/**
 * Enum listing the protocol to use for the holepunch
 */
export declare enum RendezvousProtocol {
    UDP = 0,
    TCP = 1,
}
export declare enum MessageType {
    DATA = 0,
    HANDSHAKE = 1,
}
export declare enum HandshakeRequestType {
    REGISTRATION = 0,
    HOLEPUNCH = 1,
}
/**
 * @member port {number}: (optional) specifies the port to listen onto
 * @member host {string}: (optional) specifies the hosts to filter when listening
 * @member protocol {UDP | TCP}: (optional) specifies the protocol to use for the handshake
 */
export interface RendezvousOptions {
    port?: number;
    host?: string;
    protocol?: RendezvousProtocol;
}
/**
 * Interface representing a single peer requesting an handshake
 */
export interface Peer {
    id: string;
    host?: string;
    port?: number;
}
export interface HandshakeRequest {
    type: HandshakeRequestType;
    peer?: Peer;
    remote?: string;
}
export interface Message {
    id: string;
    host: string;
    port: number;
    type: MessageType;
}
/**
 * @author Marco Moschettini
 * @version 0.0.1
 * @implements EventEmitter
 * @class
 */
export declare class Rendezvous extends EventEmitter {
    private _port;
    private _host;
    private _socket;
    private _peers;
    constructor(options?: RendezvousOptions);
    /**
     * Method that makes the server listening on the provided host and port.
     * @returns Promise <any>: resolved when server has bound to the port
     */
    listen(): Promise<any>;
    private _on_message(message, sender);
}
