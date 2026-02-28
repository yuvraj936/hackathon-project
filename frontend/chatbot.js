// ============================
// HexCare AI Chatbot (Clean)
// - No timestamps
// - Line breaks preserved
// - Close stops TTS + STT completely
// - Mic auto-send safe
// ============================

const API_PATH = "http://localhost:5001/api/chat"; // change to "/chat" if your backend uses /chat

// DOM
const waFab = document.getElementById("waFab");
const waOverlay = document.getElementById("waOverlay");
const chatWidget = document.getElementById("chatWidget");
const closeBtn = document.getElementById("closeBtn");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const voiceBtn = document.getElementById("voiceBtn");
const langSelect = document.getElementById("langSelect");
const userInput = document.getElementById("userInput");
const chatBody = document.getElementById("chatBody");
const waStatus = document.getElementById("waStatus");

// State
let voiceEnabled = true;
let recognition = null;
let listening = false;
let closingChat = false;

// Helpers
function setStatus(t){ if(waStatus) waStatus.textContent = t; }
function escapeHTML(str=""){
  return str
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function formatText(str=""){
  const safe = escapeHTML(str);
  return safe
    .replace(/\n/g, "<br>")
    .replace(/(^|<br>)\s*-\s+/g, "$1• ");
}

function addBubble(who, textOrHTML, isHTML=true){
  const div = document.createElement("div");
  div.className = `bubble ${who}`;
  div.innerHTML = isHTML ? textOrHTML : escapeHTML(textOrHTML);
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
  return div;
}

function addTyping(){
  return addBubble("bot", `
    <span class="typing">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </span>
  `, true);
}

// Open/Close
function openChat(){
  chatWidget.style.display = "flex";
  chatWidget.setAttribute("aria-hidden","false");
  waOverlay.classList.add("active");
  setTimeout(()=>userInput?.focus(), 150);
}
function closeChat(){
  closingChat = true;
  stopAllVoice();
  chatWidget.style.display = "none";
  chatWidget.setAttribute("aria-hidden","true");
  waOverlay.classList.remove("active");
  setTimeout(()=>{ closingChat = false; }, 400);
}

// TTS
function speak(text){
  if(!voiceEnabled) return;
  if(!("speechSynthesis" in window)) return;

  try{ window.speechSynthesis.cancel(); }catch(e){}
  const u = new SpeechSynthesisUtterance(text);
  u.lang = langSelect?.value || "en-IN";
  window.speechSynthesis.speak(u);
}

// STT (Mic)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function initRecognition(){
  if(!SpeechRecognition) return null;
  const r = new SpeechRecognition();
  r.continuous = false;
  r.interimResults = true;
  r.lang = langSelect?.value || "en-IN";
  return r;
}

function startListening(){
  if(!SpeechRecognition){
    addBubble("bot", formatText("Mic not supported in this browser. Use Chrome."));
    return;
  }
  if(!recognition) recognition = initRecognition();
  if(!recognition) return;

  recognition.lang = langSelect?.value || "en-IN";
  listening = true;
  micBtn?.classList.add("listening");
  setStatus("Listening…");

  let finalText = "";

  recognition.onresult = (e)=>{
    let live = "";
    for(let i=e.resultIndex; i<e.results.length; i++){
      live += e.results[i][0].transcript;
      if(e.results[i].isFinal) finalText = live.trim();
    }
    if(userInput) userInput.value = live.trim();
  };

  recognition.onerror = ()=>{
    stopListening(true);
    setStatus("Online • Ready");
  };

  recognition.onend = ()=>{
    micBtn?.classList.remove("listening");
    listening = false;
    setStatus("Online • Ready");

    const msg = (finalText || userInput?.value || "").trim();
    // ✅ close ke time auto-send nahi
    if(!closingChat && msg) sendMessage(msg);
  };

  try{ recognition.start(); }catch(e){
    stopListening(true);
  }
}

function stopListening(hard=false){
  micBtn?.classList.remove("listening");
  listening = false;

  if(recognition){
    try{
      // remove handlers to avoid weird triggers
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      hard ? recognition.abort() : recognition.stop();
    }catch(e){}
  }
}

function stopAllVoice(){
  // stop TTS
  try{ window.speechSynthesis.cancel(); }catch(e){}
  // stop STT strongly
  stopListening(true);
}

// API
async function fetchReply(message){
  const res = await fetch(API_PATH, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ message })
  });
  const data = await res.json().catch(()=> ({}));
  if(!res.ok) throw new Error(data?.reply || "Server error");
  return (data.reply || "No reply").toString();
}

// Send flow
async function sendMessage(textFromMic=""){
  const msg = (textFromMic || userInput?.value || "").trim();
  if(!msg) return;

  addBubble("user", formatText(msg), true);
  if(userInput) userInput.value = "";

  const typing = addTyping();
  setStatus("Typing…");

  try{
    const reply = await fetchReply(msg);
    typing.remove();
    addBubble("bot", formatText(reply), true);
    setStatus("Online • Ready");
    speak(reply);
  }catch(e){
    typing.remove();
    addBubble("bot", formatText("⚠️ Server not responding. Please check backend."), true);
    setStatus("Offline • Fallback");
  }
}

// Events
waFab?.addEventListener("click", openChat);
waOverlay?.addEventListener("click", closeChat);
closeBtn?.addEventListener("click", closeChat);

sendBtn?.addEventListener("click", ()=>sendMessage());
userInput?.addEventListener("keydown", (e)=>{
  if(e.key === "Enter") sendMessage();
});

micBtn?.addEventListener("click", ()=>{
  if(listening) stopListening(true);
  else startListening();
});

voiceBtn?.addEventListener("click", ()=>{
  voiceEnabled = !voiceEnabled;
  voiceBtn.textContent = voiceEnabled ? "🔊" : "🔇";
  if(!voiceEnabled) {
    try{ window.speechSynthesis.cancel(); }catch(e){}
  }
});

langSelect?.addEventListener("change", ()=>{
  stopAllVoice();
});

// First message
addBubble("bot", formatText("Hi! I’m HexCare AI. Tell me your symptoms + duration. ✅"), true);