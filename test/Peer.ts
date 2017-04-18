import {Peer} from '../src/index';
import Address from '../src/lib/Address';

let peer = new Peer('peer', {
    rendezvous: new Address('137.74.40.252', 9999)
});

peer.listen().then(() =>
{
    peer.on('connection', (connection) =>
    {
        console.log('Connection succeeded!');
        connection.on('data', (data) =>
        {
            console.log('New message received');
            console.log(data.toString());
            connection.write('Hello too!');
        });
    });
});
