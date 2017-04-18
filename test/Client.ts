import {Peer} from '../src/index';
import Address from '../src/lib/Address';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

let client = new Peer('client', {
    rendezvous: new Address('137.74.40.252', 9999),
    initiator: true
});

let file = path.resolve(os.homedir(), 'Desktop', 'Palette.zip');

client.listen().then(() =>
{
    client.on('connection', (connection) =>
    {
        let stream = fs.createReadStream(file);

        connection.on('end', () =>
        {
            console.timeEnd('send');
            connection.destroy();
        });

        console.time('send');
        stream.pipe(connection);
    });

    client.get_connection_with('peer');
});
