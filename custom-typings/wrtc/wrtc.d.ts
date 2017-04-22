///<reference path="../../typings/globals/node/index.d.ts"/>

type EventHandler = (event: Event) => void;

export interface RTCDTMFToneChangeEvent extends Event
{
    readonly tone: string;
}

export let RTCDTMFToneChangeEvent: {
    prototype: RTCDTMFToneChangeEvent;
    new(typeArg: string, eventInitDict: RTCDTMFToneChangeEventInit): RTCDTMFToneChangeEvent;
};

export interface RTCDtlsTransportEventMap
{
    "dtlsstatechange": RTCDtlsTransportStateChangedEvent;
    "error": Event;
}

export interface RTCDtlsTransport extends RTCStatsProvider
{
    ondtlsstatechange: ((this: RTCDtlsTransport, ev: RTCDtlsTransportStateChangedEvent) => any) | null;
    onerror: ((this: RTCDtlsTransport, ev: Event) => any) | null;
    readonly state: string;
    readonly transport: RTCIceTransport;
    getLocalParameters(): RTCDtlsParameters;
    getRemoteCertificates(): ArrayBuffer[];
    getRemoteParameters(): RTCDtlsParameters | null;
    start(remoteParameters: RTCDtlsParameters): void;
    stop(): void;
    //addEventListener<K extends keyof RTCDtlsTransportEventMap>(type: K, listener: (this: RTCDtlsTransport, ev: RTCDtlsTransportEventMap[K]) => any, useCapture?: boolean): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

export let RTCDtlsTransport: {
    prototype: RTCDtlsTransport;
    new(transport: RTCIceTransport): RTCDtlsTransport;
};

export interface RTCDtlsTransportStateChangedEvent extends Event
{
    readonly state: string;
}

export let RTCDtlsTransportStateChangedEvent: {
    prototype: RTCDtlsTransportStateChangedEvent;
    new(): RTCDtlsTransportStateChangedEvent;
};

export interface RTCDtmfSenderEventMap
{
    "tonechange": RTCDTMFToneChangeEvent;
}

export interface RTCDtmfSender extends EventTarget
{
    readonly canInsertDTMF: boolean;
    readonly duration: number;
    readonly interToneGap: number;
    ontonechange: (this: RTCDtmfSender, ev: RTCDTMFToneChangeEvent) => any;
    readonly sender: RTCRtpSender;
    readonly toneBuffer: string;
    insertDTMF(tones: string, duration?: number, interToneGap?: number): void;
    //addEventListener<K extends keyof RTCDtmfSenderEventMap>(type: K, listener: (this: RTCDtmfSender, ev: RTCDtmfSenderEventMap[K]) => any, useCapture?: boolean): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

export let RTCDtmfSender: {
    prototype: RTCDtmfSender;
    new(sender: RTCRtpSender): RTCDtmfSender;
};

export interface RTCIceCandidate
{
    candidate: string | null;
    sdpMLineIndex: number | null;
    sdpMid: string | null;
    toJSON(): any;
}

export let RTCIceCandidate: {
    prototype: RTCIceCandidate;
    new(candidateInitDict?: any): RTCIceCandidate;
};

export interface RTCIceCandidatePairChangedEvent extends Event
{
    readonly pair: RTCIceCandidatePair;
}

export let RTCIceCandidatePairChangedEvent: {
    prototype: RTCIceCandidatePairChangedEvent;
    new(): RTCIceCandidatePairChangedEvent;
};

export interface RTCIceGathererEventMap
{
    "error": Event;
    "localcandidate": RTCIceGathererEvent;
}

export interface RTCIceGatherer extends RTCStatsProvider
{
    readonly component: string;
    onerror: ((this: RTCIceGatherer, ev: Event) => any) | null;
    onlocalcandidate: ((this: RTCIceGatherer, ev: RTCIceGathererEvent) => any) | null;
    createAssociatedGatherer(): RTCIceGatherer;
    //getLocalCandidates(): RTCIceCandidateDictionary[];
    getLocalParameters(): RTCIceParameters;
    //addEventListener<K extends keyof RTCIceGathererEventMap>(type: K, listener: (this: RTCIceGatherer, ev: RTCIceGathererEventMap[K]) => any, useCapture?: boolean): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

export let RTCIceGatherer: {
    prototype: RTCIceGatherer;
    new(options: RTCIceGatherOptions): RTCIceGatherer;
};

export let RTCIceGathererEvent: {
    prototype: RTCIceGathererEvent;
    new(): RTCIceGathererEvent;
};

export interface RTCIceTransportEventMap
{
    "candidatepairchange": RTCIceCandidatePairChangedEvent;
    "icestatechange": RTCIceTransportStateChangedEvent;
}

export interface RTCIceTransport extends RTCStatsProvider
{
    readonly component: string;
    readonly iceGatherer: RTCIceGatherer | null;
    oncandidatepairchange: ((this: RTCIceTransport, ev: RTCIceCandidatePairChangedEvent) => any) | null;
    onicestatechange: ((this: RTCIceTransport, ev: RTCIceTransportStateChangedEvent) => any) | null;
    readonly role: string;
    readonly state: string;
    createAssociatedTransport(): RTCIceTransport;
    getNominatedCandidatePair(): RTCIceCandidatePair | null;
    getRemoteParameters(): RTCIceParameters | null;
    start(gatherer: RTCIceGatherer, remoteParameters: RTCIceParameters, role?: string): void;
    stop(): void;
    //addEventListener<K extends keyof RTCIceTransportEventMap>(type: K, listener: (this: RTCIceTransport, ev: RTCIceTransportEventMap[K]) => any, useCapture?: boolean): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

export let RTCIceTransport: {
    prototype: RTCIceTransport;
    new(): RTCIceTransport;
};

export interface RTCIceTransportStateChangedEvent extends Event
{
    readonly state: string;
}

export let RTCIceTransportStateChangedEvent: {
    prototype: RTCIceTransportStateChangedEvent;
    new(): RTCIceTransportStateChangedEvent;
};

export interface RTCDataChannelEvent
{
    readonly channel: RTCDataChannel;
}

export interface RTCPeerConnection extends EventTarget
{
    readonly canTrickleIceCandidates: boolean | null;
    readonly iceConnectionState: string;
    readonly iceGatheringState: string;
    readonly localDescription: RTCSessionDescription | null;
    //onaddstream: (this: RTCPeerConnection, ev: MediaStreamEvent) => any;
    onicecandidate: (this: RTCPeerConnection, ev: RTCPeerConnectionIceEvent) => any;
    oniceconnectionstatechange: (this: RTCPeerConnection, ev: Event) => any;
    onicegatheringstatechange: (this: RTCPeerConnection, ev: Event) => any;
    onnegotiationneeded: (this: RTCPeerConnection, ev: Event) => any;
    //onremovestream: (this: RTCPeerConnection, ev: MediaStreamEvent) => any;
    onsignalingstatechange: (this: RTCPeerConnection, ev: Event) => any;
    ondatachannel: (event: RTCDataChannelEvent) => void;
    readonly remoteDescription: RTCSessionDescription | null;
    readonly signalingState: string;
    addIceCandidate(candidate: RTCIceCandidate, successCallback?: () => void, failureCallback?: (error: Error) => void): Promise<void>;
    addStream(stream: MediaStream): void;
    createDataChannel(label: string | null, dataChannelDict?: RTCDataChannelInit): RTCDataChannel;
    close(): void;
    createAnswer(successCallback?: (RTCSessionDescription) => void, failureCallback?: (error: Error) => void): Promise<RTCSessionDescription>;
    createOffer(successCallback?: (RTCSessionDescription) => void, failureCallback?: (error: Error) => void, options?: any): Promise<RTCSessionDescription>;
    getConfiguration(): any;
    getLocalStreams(): MediaStream[];
    getRemoteStreams(): MediaStream[];
    getStats(selector: MediaStreamTrack | null, successCallback?: () => void, failureCallback?: (error: Error) => void): Promise<RTCStatsReport>;
    getStreamById(streamId: string): MediaStream | null;
    removeStream(stream: MediaStream): void;
    setLocalDescription(description: RTCSessionDescription, successCallback?: () => void, failureCallback?: (error: Error) => void): Promise<void>;
    setRemoteDescription(description: RTCSessionDescription, successCallback?: () => void, failureCallback?: (error: Error) => void): Promise<void>;
    //addEventListener<K extends keyof RTCPeerConnectionEventMap>(type: K, listener: (this: RTCPeerConnection, ev:
    // RTCPeerConnectionEventMap[K]) => any, useCapture?: boolean): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

export let RTCPeerConnection: {
    prototype: RTCPeerConnection;
    new(configuration: any): RTCPeerConnection;
};

export interface RTCPeerConnectionIceEvent extends Event
{
    readonly candidate: RTCIceCandidate;
}

declare let RTCPeerConnectionIceEvent: {
    prototype: RTCPeerConnectionIceEvent;
    new(type: string, eventInitDict: any): RTCPeerConnectionIceEvent;
};

export interface RTCRtpReceiverEventMap
{
    "error": Event;
}

export interface RTCRtpReceiver extends RTCStatsProvider
{
    onerror: ((this: RTCRtpReceiver, ev: Event) => any) | null;
    readonly rtcpTransport: RTCDtlsTransport;
    readonly track: MediaStreamTrack | null;
    readonly transport: RTCDtlsTransport | RTCSrtpSdesTransport;
    getContributingSources(): RTCRtpContributingSource[];
    receive(parameters: RTCRtpParameters): void;
    requestSendCSRC(csrc: number): void;
    setTransport(transport: RTCDtlsTransport | RTCSrtpSdesTransport, rtcpTransport?: RTCDtlsTransport): void;
    stop(): void;
    //addEventListener<K extends keyof RTCRtpReceiverEventMap>(type: K, listener: (this: RTCRtpReceiver, ev: RTCRtpReceiverEventMap[K]) => any, useCapture?: boolean): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

export let RTCRtpReceiver: {
    prototype: RTCRtpReceiver;
    new(transport: RTCDtlsTransport | RTCSrtpSdesTransport, kind: string, rtcpTransport?: RTCDtlsTransport): RTCRtpReceiver;
    getCapabilities(kind?: string): RTCRtpCapabilities;
};

export interface RTCRtpSenderEventMap
{
    "error": Event;
    "ssrcconflict": RTCSsrcConflictEvent;
}

export interface RTCRtpSender extends RTCStatsProvider
{
    onerror: ((this: RTCRtpSender, ev: Event) => any) | null;
    onssrcconflict: ((this: RTCRtpSender, ev: RTCSsrcConflictEvent) => any) | null;
    readonly rtcpTransport: RTCDtlsTransport;
    readonly track: MediaStreamTrack;
    readonly transport: RTCDtlsTransport | RTCSrtpSdesTransport;
    send(parameters: RTCRtpParameters): void;
    setTrack(track: MediaStreamTrack): void;
    setTransport(transport: RTCDtlsTransport | RTCSrtpSdesTransport, rtcpTransport?: RTCDtlsTransport): void;
    stop(): void;
    //addEventListener<K extends keyof RTCRtpSenderEventMap>(type: K, listener: (this: RTCRtpSender, ev: RTCRtpSenderEventMap[K]) => any, useCapture?: boolean): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

export let RTCRtpSender: {
    prototype: RTCRtpSender;
    new(track: MediaStreamTrack, transport: RTCDtlsTransport | RTCSrtpSdesTransport, rtcpTransport?: RTCDtlsTransport): RTCRtpSender;
    getCapabilities(kind?: string): RTCRtpCapabilities;
};

export interface RTCSessionDescription
{
    sdp: string | null;
    type: string | null;
    toJSON(): any;
}

declare let RTCSessionDescription: {
    prototype: RTCSessionDescription;
    new(descriptionInitDict?: any): RTCSessionDescription;
};

export interface RTCSrtpSdesTransportEventMap
{
    "error": Event;
}

export interface RTCSrtpSdesTransport extends EventTarget
{
    onerror: ((this: RTCSrtpSdesTransport, ev: Event) => any) | null;
    readonly transport: RTCIceTransport;
    //addEventListener<K extends keyof RTCSrtpSdesTransportEventMap>(type: K, listener: (this: RTCSrtpSdesTransport, ev: RTCSrtpSdesTransportEventMap[K]) => any, useCapture?: boolean): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
}

export let RTCSrtpSdesTransport: {
    prototype: RTCSrtpSdesTransport;
    new(transport: RTCIceTransport, encryptParameters: RTCSrtpSdesParameters, decryptParameters: RTCSrtpSdesParameters): RTCSrtpSdesTransport;
    getLocalParameters(): RTCSrtpSdesParameters[];
};

export interface RTCSsrcConflictEvent extends Event
{
    readonly ssrc: number;
}

export let RTCSsrcConflictEvent: {
    prototype: RTCSsrcConflictEvent;
    new(): RTCSsrcConflictEvent;
};

export interface RTCStatsProvider extends EventTarget
{
    getStats(): Promise<RTCStatsReport>;
    msGetStats(): Promise<RTCStatsReport>;
}

export let RTCStatsProvider: {
    prototype: RTCStatsProvider;
    new(): RTCStatsProvider;
};

export interface RTCDataChannelInit
{
    ordered?: boolean; // default = true
    maxPacketLifeTime?: number;
    maxRetransmits?: number;
    protocol?: string; // default = ''
    negotiated?: boolean; // default = false
    id?: number;
}

type RTCDataChannelState = 'connecting' | 'open' | 'closing' | 'closed';
type RTCBinaryType = 'blob' | 'arraybuffer';

export interface RTCDataChannel extends EventTarget
{
    readonly label: string;
    readonly ordered: boolean;
    readonly maxPacketLifeTime: number | null;
    readonly maxRetransmits: number | null;
    readonly protocol: string;
    readonly negotiated: boolean;
    readonly id: number;
    readonly readyState: RTCDataChannelState;
    readonly bufferedAmount: number;
    bufferedAmountLowThreshold: number;
    binaryType: RTCBinaryType;

    close(): void;
    send(data: string | Blob | ArrayBuffer | ArrayBufferView): void;

    onopen: EventHandler;
    onmessage: (event: MessageEvent) => void;
    onbufferedamountlow: EventHandler;
    onerror: (event: ErrorEvent) => void;
    onclose: EventHandler;
}

