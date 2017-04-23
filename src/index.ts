/*
 MIT License

 Copyright (c) 2017 Marco Moschettini, Matteo Monti

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

import {Peer} from './lib/Peer';
import {Rendezvous} from './lib/Rendezvous';

export {Peer, Rendezvous};

import * as pmp from 'nat-pmp';
import * as netroute from 'netroute';
import * as upnp from 'nat-upnp';

let gateway = netroute.getGateway();
console.log('Gateway address:', gateway);
let client = pmp.connect(gateway);

client.externalIp(function (err, info)
{
    if (err) throw err;
    console.log('Current external IP address: %s', info.ip.join('.'));
});

console.log('Mapping port private port 22 to external port 2222...');
client.portMapping({ private: 22, public: 2222, type: 'udp' }, function (err, info)
{
    if (err) throw err;
    console.log(info.resultMessage);
    client.close();
});
