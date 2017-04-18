import {Peer} from '../src/index';
import Address from '../src/lib/Address';
import * as fs from 'fs';
import * as path from 'path';

let peer = new Peer('peer', {
    rendezvous: new Address('137.74.40.252', 9999)
});

let output = path.resolve(__dirname, 'palette.zip');

peer.listen().then(() =>
{
    peer.on('connection', (connection) =>
    {
        let write_stream = fs.createWriteStream(output);

        connection.on('end', () =>
        {
            console.timeEnd('receive');
            write_stream.close();
            connection.destroy();
        });

        console.time('receive');
        connection.pipe(write_stream);
    });
});
