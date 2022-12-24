import { createServer, STATUS_CODES } from "http";
import { createReadStream } from "fs";
import { createHash } from "crypto";
import { join } from "path";
import mime from "./mime.json" assert { type: "json" };
import EventEmitter from "events";

const stream = new EventEmitter();

function session(socket) {
  function listener(message) {
    socket.write(message);
  }
  stream.on("message", listener);
  socket.on("data", data => stream.emit("message", data.toString()));
  socket.on("close", () => stream.removeListener("message", listener));
}

createServer((req, res) => {
  if(req.url == "/session") {
    const body = STATUS_CODES[426];
    res.writeHead(426, {
      'Content-Length': body.length,
      'Content-Type': 'text/plain'
    });
    res.end(body);
    return;
  }

  const url = req.url == "/" ? "index.html" : req.url

  res.writeHead(200, { "Content-Type": mime[url.match(/\w+$/)[0]] });
  createReadStream(join("views", url))
  .pipe(res)
  .on("error", err => res.end(err));
})
.listen(80, console.log("server is online at http://localhost"))
.on('upgrade', (req, socket) => {
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${
      createHash('sha1')
        .update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64')
    }\r\n\r\n`
  );
  const customSocket = new EventEmitter();
  socket.on('data', data => {
    if(data[0] == 0x88) return customSocket.emit("close");
    const xor = data.slice(2, 6);
    data = data.slice(6).map((byte, i) => byte ^ xor[i % 4]);
    customSocket.emit('data', data);
  });
  customSocket.write = (text) => {
    socket.write(
      Buffer.from([
        0x81,
        text.length,
        ...Buffer.from(text)
      ])
    );
  }
  session(customSocket);
});