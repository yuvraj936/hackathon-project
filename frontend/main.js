function appendMessage(sender, text) {
  const body = document.getElementById("chat-body");
  const div = document.createElement("div");

  div.className = sender === "You" ? "chat-user" : "chat-bot";
  div.innerHTML = `<b>${sender}:</b> ${text}`;

  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const msg = input.value.trim();
  if (!msg) return;

  appendMessage("You", msg);
  input.value = "";

  appendMessage("Jarvis", "Thinking...");

  const res = await fetch("http://localhost:5001/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: msg }),
  });

  const data = await res.json();
  appendMessage("Jarvis", data.reply);
} 