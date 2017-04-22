import {Peer} from '../src/index';
import Address from '../src/lib/Address';
import * as fs from 'fs';
import * as path from 'path';
import {ProtocolType} from '../src/lib/Requests';

let peer = new Peer('peer', {
    rendezvous: new Address('localhost', 9999),
    protocol: ProtocolType.UTP
});

let output = path.resolve(__dirname, 'palette.zip');

peer.listen().then(() =>
{
    console.log('[STARTED]');
    peer.on('connection', (connection) =>
    {
        console.log('Connection succeeded.');

        let stream = fs.createWriteStream(output);

        connection.on('close', () =>
        {
            console.log('Connection closed. Bye!');
            process.exit(0);
        });

        connection.pipe(stream);
    });
});
