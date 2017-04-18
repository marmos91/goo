import {Peer} from '../src/index';
import Address from '../src/lib/Address';

let client = new Peer('client', {
    rendezvous: new Address('137.74.40.252', 9999)
});

client.listen().then(() =>
{
    client.on('connection', () =>
    {
        console.log('Connection succeeded!');
    });

    client.get_connection_with('peer');
});
