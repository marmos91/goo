import {Peer} from '../../src/index';
import Address from '../../src/lib/Address';
import * as fs from 'fs';
import * as path from 'path';
import * as minimist from 'minimist';

let argv = minimist(process.argv.slice(2));

let peer = new Peer(argv['name'], {
    rendezvous: new Address(argv['host'], argv['port'])
});

let output = path.resolve(argv['output']);

peer.listen().then(() =>
{
    console.log('Ready.');
    peer.on('connection', (connection) =>
    {
        console.log('Connection succeeded. Receiving payload...');
        let stream = fs.createWriteStream(output);

        connection.on('close', () =>
        {
            console.log('Payload received. Closing connection.');
            process.exit(0);
        });

        connection.pipe(stream);
    });
});
