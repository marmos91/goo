import {Peer} from '../src/index';
import Address from '../src/lib/Address';

let client = new Peer('client', {
    rendezvous: new Address('137.74.40.252', 9999),
    initiator: true
});

client.listen().then(() =>
{
    client.on('connection', (connection) =>
    {
        console.log('Connection succeeded!');
        connection.on('data', (data) =>
        {
            console.log('new message received');
            console.log(data.toString());
        });

        connection.write('Hello world!');
    });

    client.get_connection_with('peer');
});
