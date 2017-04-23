import {Rendezvous} from '../../src/lib/Rendezvous';
import * as minimist from 'minimist';

let argv = minimist(process.argv.slice(2));

new Rendezvous({host: argv['host'], port: argv['port']}).listen().then(() =>
{
    console.log('Server listening...');
});
