import {Peer} from '../src/index';
import Address from '../src/lib/Address';

let peer = new Peer('peer', {
    rendezvous: new Address('137.74.40.252', 9999)
});

peer.listen().then(() =>
{
    peer.on('connection', () =>
    {
        console.log('Connection succeeded!');
    });
});
