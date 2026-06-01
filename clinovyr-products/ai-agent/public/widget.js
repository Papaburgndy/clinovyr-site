(function () {
  "use strict";

  if (window.location.protocol === "http:") {
    console.warn(
      "[Clinovyr Widget] This widget should be loaded on HTTPS pages for security.",
    );
  }

  var apiBase = window.location.protocol + "//clinovyr.com";
  var script = document.currentScript;
  var clientId = (script && script.getAttribute("data-client-id")) || "";

  if (!clientId) {
    console.error("[Clinovyr Widget] Missing data-client-id on script tag.");
    return;
  }

  var sessionId =
    localStorage.getItem("clinovyr-session-" + clientId) ||
    "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem("clinovyr-session-" + clientId, sessionId);

  var root = document.createElement("div");
  root.id = "clinovyr-widget-host";
  document.body.appendChild(root);

  var mountTarget = root;
  if (root.attachShadow) {
    mountTarget = root.attachShadow({ mode: "closed" });
  }

  var widget = document.createElement("div");
  widget.id = "clinovyr-widget";
  mountTarget.appendChild(widget);

  var style = document.createElement("style");
  style.textContent =
    "#clinovyr-widget { all: initial; font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.4; color: #0d0f12; }" +
    "#clinovyr-widget * { box-sizing: border-box; }" +
    "#clinovyr-widget .cv-toggle { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%; border: none; background: #1a6b5a; color: #f5f2ed; cursor: pointer; font-size: 22px; box-shadow: 0 4px 16px rgba(13,15,18,0.2); z-index: 99999; }" +
    "#clinovyr-widget .cv-panel { display: none; position: fixed; bottom: 92px; right: 24px; width: 340px; max-width: calc(100vw - 48px); height: 420px; background: #f5f2ed; border: 1px solid #d8d3ca; border-radius: 12px; flex-direction: column; overflow: hidden; box-shadow: 0 8px 32px rgba(13,15,18,0.15); z-index: 99999; }" +
    "#clinovyr-widget .cv-panel.cv-open { display: flex; }" +
    "#clinovyr-widget .cv-header { padding: 14px 16px; background: #1a6b5a; color: #f5f2ed; font-weight: 600; }" +
    "#clinovyr-widget .cv-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }" +
    "#clinovyr-widget .cv-msg { max-width: 85%; padding: 8px 12px; border-radius: 10px; word-wrap: break-word; }" +
    "#clinovyr-widget .cv-msg-user { align-self: flex-end; background: #1a6b5a; color: #f5f2ed; }" +
    "#clinovyr-widget .cv-msg-bot { align-self: flex-start; background: #ede9e2; color: #0d0f12; }" +
    "#clinovyr-widget .cv-input-row { display: flex; gap: 8px; padding: 12px; border-top: 1px solid #d8d3ca; background: #f5f2ed; }" +
    "#clinovyr-widget .cv-input { flex: 1; padding: 8px 12px; border: 1px solid #d8d3ca; border-radius: 8px; font: inherit; outline: none; }" +
    "#clinovyr-widget .cv-send { padding: 8px 14px; border: none; border-radius: 8px; background: #1a6b5a; color: #f5f2ed; cursor: pointer; font: inherit; }" +
    "#clinovyr-widget .cv-send:disabled { opacity: 0.5; cursor: not-allowed; }";
  mountTarget.appendChild(style);

  widget.innerHTML =
    '<button type="button" class="cv-toggle" aria-label="Open chat">💬</button>' +
    '<div class="cv-panel" role="dialog" aria-label="Chat assistant">' +
    '<div class="cv-header">Chat with us</div>' +
    '<div class="cv-messages"></div>' +
    '<form class="cv-input-row">' +
    '<input class="cv-input" type="text" placeholder="Type a message…" autocomplete="off" />' +
    '<button class="cv-send" type="submit">Send</button>' +
    "</form></div>";

  var toggle = widget.querySelector(".cv-toggle");
  var panel = widget.querySelector(".cv-panel");
  var messagesEl = widget.querySelector(".cv-messages");
  var form = widget.querySelector(".cv-input-row");
  var input = widget.querySelector(".cv-input");
  var sendBtn = widget.querySelector(".cv-send");

  toggle.addEventListener("click", function () {
    panel.classList.toggle("cv-open");
    if (panel.classList.contains("cv-open")) {
      input.focus();
    }
  });

  function appendMessage(text, role) {
    var el = document.createElement("div");
    el.className = "cv-msg cv-msg-" + role;
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setLoading(loading) {
    sendBtn.disabled = loading;
    input.disabled = loading;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;

    appendMessage(text, "user");
    input.value = "";
    setLoading(true);

    fetch(apiBase + "/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: clientId,
        sessionId: sessionId,
        message: text,
      }),
    })
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .then(function (result) {
        if (result.body.sessionId) {
          sessionId = result.body.sessionId;
          localStorage.setItem("clinovyr-session-" + clientId, sessionId);
        }
        var reply =
          result.body.reply ||
          result.body.error ||
          "Sorry, something went wrong. Please try again.";
        appendMessage(reply, "bot");
      })
      .catch(function () {
        appendMessage(
          "Unable to reach our assistant right now. Please try again shortly.",
          "bot",
        );
      })
      .finally(function () {
        setLoading(false);
        input.focus();
      });
  });
})();
