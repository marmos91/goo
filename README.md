# goo
An all-in-one set of nat-traversal utilities written in Typescript.

## How to execute the benchmarks
First of all you need to compile the project running `tsc` in the main folder.
Then you need to launch `Server.js`, `Peer.js` and `Client.js` (in the dist/test/benchmarks folder) on three differents machines residing behind three different NATs (**Note**: `Server.js` still needs to execute on a public IP).
The scripts will accept the following parameters:

### Server.js
- **host**: the host on which listen (*default: 0.0.0.0*)
- **port**: the port on which listen (*default: 4321*)

```bash
node Server.js --port=9999
```

### Peer.js
- **host**: the rendezvous-server ip
- **port**: the rendezvous-server port
- **name**: the name to assign to the peer
- **output**: the absolute output path to save the payload to

```bash
node Peer.js --host=signal.goo.com --port=9999 --output=/usr/local/test.mov
```

### Client.js
- **host**: the rendezvous-server ip
- **port**: the rendezvous-server port
- **name**: the name to assign to the peer
- **payload**: the absolute path to payload to be sent

```bash
node Client.js --host=signal.goo.com --port=9999 --payload=/usr/local/test.mov
```

### Important note
Please note that this is still **experimental**. Do not use in a real environment.
