import {Rendezvous} from '../src/lib/Rendezvous';
import {ProtocolType} from '../src/lib/Requests';

new Rendezvous({port: 9999, protocol: ProtocolType.UTP}).listen().then(() =>
{
    console.log('Server listening...');
});
