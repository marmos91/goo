import Address from './Address';
import {RTCIceCandidate} from 'wrtc';

export enum HandshakeRequestType {REGISTRATION = 0, HOLEPUNCH, SIGNALING}
export enum MessageType {REGISTRATION = 0, HOLEPUNCH, PAYLOAD, HANDSHAKE, SIGNAL, ACK}
export enum ProtocolType {UTP, WEBRTC}

/**
 * Interface representing an Handshake request (sent by the peer to the rendezvous server)
 */
export interface HandshakeRequest
{
    type: HandshakeRequestType;
    peer_id?: string;
    remote_id?: string;
    signal?: RTCIceCandidate;
}

/**
 * Interface representing the holepunch message.
 * @member id {string}: The id given for the holepunch
 * @member port {number}: Specifies the port to use for the holepunch
 * @member host {string}: Specifies the host to use for the holepunch
 * @member type {MessageType}: Specifies the message type (Handshake message or Holepunch message)
 * @member body {string|Buffer}: (optional) An optional body for the message
 */
export interface Message
{
    type: MessageType;
    id?: string;
    endpoint?: Address;
    body?: string | Buffer | RTCIceCandidate;
}
