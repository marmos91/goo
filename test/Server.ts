import {Rendezvous} from '../src/lib/Rendezvous';

new Rendezvous({port: 9999}).listen().then(() =>
{
    console.log('Server listening...');
});
