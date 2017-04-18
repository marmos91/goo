import * as stream from 'stream';
import {AddressInfo} from 'dgram';
import {EventEmitter} from 'events';
import construct = Reflect.construct;
export {AddressInfo};

export class UTP extends EventEmitter
{
    constructor();
    address(): AddressInfo;
    bind(port: number, ip: string | Buffer, onlistening?: Function): any;
    close(cb?: Function): void;
    connect(port: number, host: string | Buffer): any;
    listen(port: number, ip: string | Buffer, onlistening?: Function): void;
    ref(): void;
    send(buf: string | Buffer, offset: number, len: number, port: number, host: string | Buffer, cb?: Function): any;
    unref(): void;

    static client: UTP;
    static connect(port: number, host: string | Buffer): Connection;
    static createServer(onconnection?: Function): UTP;
}

export interface Connection extends stream.Duplex
{
    address(): any;
    destroy(): void;
    ref(): void;
    unref(): void;
}
