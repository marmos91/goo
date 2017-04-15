/// <reference types="node" />
import { EventEmitter } from 'events';
export declare enum RendezvousProtocol {
    UDP = 0,
    UTP = 1,
    UDT = 2,
    TCP = 3,
}
export declare enum MessageType {
    PAYLOAD = 0,
    HANDSHAKE = 1,
    HOLEPUNCH = 2,
    ACK = 3,
}
export declare enum HandshakeRequestType {
    REGISTRATION = 0,
    HOLEPUNCH = 1,
}
/**
 * @member port {number}: (optional) specifies the port to listen onto
 * @member host {string}: (optional) specifies the hosts to filter when listening
 * @member protocol {UDP | TCP}: (optional) specifies the protocol to use for the handshake
 * @member retry {number}: The retry interval for the holepunch
 */
export interface RendezvousOptions {
    rendezvous: {
        port: number;
        host: string;
    };
    port?: number;
    host?: string;
    protocol?: RendezvousProtocol;
    retry?: number;
}
/**
 * Interface representing the holepunch message.
 * @member id {string}: The id given for the holepunch
 * @member port {number}: Specifies the port to use for the holepunch
 * @member host {string}: Specifies the host to use for the holepunch
 * @member type {MessageType}: Specifies the message type (Handshake message or Holepunch message)
 * @member body {string|Buffer}: (optional) An optional body for the message
 */
export interface Message {
    id: string;
    host: string;
    port: number;
    type: MessageType;
    body?: string | Buffer;
}
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
/**
 * Class representing a peer
 * @author Marco Moschettini
 * @version 0.0.1
 * @class
 */
export declare class Peer extends EventEmitter {
    private _socket;
    private _id;
    private _host;
    private _port;
    private _interval;
    private _punch_interval;
    private _protocol;
    private _retry_interval;
    private _connected;
    private _rendezvous;
    private _remote;
    constructor(id: string, options: RendezvousOptions);
    /**
     * Method that makes the peer listen on the the given port
     * @returns Promise <any>: resolved when peer has bound to the port
     */
    listen(): Promise<any>;
    /**
     * Method that sends the handshake request to the rendezvous server
     * @param peer_id {string}: The id of the peer to connect to.
     * @param onconnection
     */
    get_connection_with(peer_id: string): void;
    /**
     * Method that performs a receive when a new message from rendezvous server is received.
     * @param message {string|Buffer}: The received message
     * @param sender {dgram.AddressInfo}: Sender infos
     * @private
     */
    private _receive(message, sender);
    /**
     * Method performing the actual holepunch
     * @param remote {Message}: The message to punch through the NAT.
     * @private
     */
    private _holepunch(remote);
}
