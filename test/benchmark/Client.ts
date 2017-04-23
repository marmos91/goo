import * as fs from 'fs';
import * as path from 'path';
import {Peer} from '../../src/index';
import Address from '../../src/lib/Address';
import * as minimist from 'minimist';

let argv = minimist(process.argv.slice(2));

let client = new Peer(argv['name'], {
    rendezvous: new Address(argv['host'], argv['port']),
    initiator: true
});

let file = path.resolve(argv['payload']);
let stats = fs.statSync(file);

console.log('*', '************************* GOO BENCHMARK ******************************', '*');
console.log('* \t', `Payload: ${file}, Size: ${(stats.size / 1000000).toFixed(2)}`, 'MB\t *');
console.log('*', '**********************************************************************', '*');

let start: number;
client.listen().then(() =>
{
    client.on('connection', (connection) =>
    {
        console.timeEnd('[Holepunch time]');
        let stream = fs.createReadStream(file);

        stream.on('end', () =>
        {
            console.timeEnd('[Transfer time]');
            let seconds = (Date.now() - start) / 1000;
            console.log('[Transfer speed]:', ((stats.size / seconds) / 1000000).toFixed(2), 'MB/s');
            connection.destroy(() => process.exit(0));
        });

        console.time('[Transfer time]');
        start = Date.now();
        console.log('[Status] transferring payload...');
        stream.pipe(connection);
    });

    console.time('[Holepunch time]');
    client.get_connection_with('peer');
});
