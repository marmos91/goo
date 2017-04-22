import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {Peer} from '../src/index';
import Address from '../src/lib/Address';
import {ProtocolType} from '../src/lib/Requests';

let client = new Peer('client', {
    rendezvous: new Address('localhost', 9999),
    initiator: true,
    protocol: ProtocolType.UTP
});

let file = path.resolve(os.homedir(), 'Desktop', 'Palette.zip');

client.listen().then(() =>
{
    console.log('[STARTED]');

    client.on('connection', (connection) =>
    {
        console.timeEnd('holepunch');

        let stream = fs.createReadStream(file);

        stream.on('end', () =>
        {
            console.timeEnd('transfer');
            connection.destroy(() =>
            {
                console.log('Connection closed');
                process.exit(0);
            });
        });

        console.time('transfer');
        stream.pipe(connection);
    });

    console.time('holepunch');
    client.get_connection_with('peer');
});
