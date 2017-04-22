import {Peer} from '../src/index';
import Address from '../src/lib/Address';
import * as fs from 'fs';
import * as path from 'path';

let peer = new Peer('peer', {
    rendezvous: new Address('localhost', 9999)
});

let output = path.resolve(__dirname, 'palette.zip');

peer.listen().then(() =>
{
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
