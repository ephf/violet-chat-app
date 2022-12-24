import MessageCluster from "./components/message.js";

const id = Math.random().toString(36);
const ws = new WebSocket("ws://127.0.0.1:80/session");
await new Promise(resolve => ws.onopen = resolve);

const input = document.querySelector("#inputs input");
const sendButton = document.querySelector("#inputs button");
const messages = document.querySelector("#messages");

function sendMessage() {
  if(!input.value) return;
  ws.send(JSON.stringify({
    author: id,
    content: input.value
  }));
  input.value = "";
}

input.onkeyup = e => e.key == "Enter" && sendMessage();
sendButton.onclick = sendMessage;

let lastMessage;
let lastMessageAuthor;
ws.onmessage = ({ data }) => {
  const { author, content } = JSON.parse(data);

  if(lastMessageAuthor == author) {
    lastMessage.append(<p class="content">{content}</p>);
    return;
  }

  lastMessage = <MessageCluster get={() => ({ me: author == id, content })}/>
  lastMessageAuthor = author;
  messages.prepend(lastMessage);
}