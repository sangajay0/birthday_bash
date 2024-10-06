document.addEventListener("DOMContentLoaded", onLoad);

function onLoad() {
  console.log("Page loaded");
  setLastSeen();

  const chatContainer = document.getElementById("chatting");
  const buttonsContainer = document.getElementById("button-container");

  fetch("conversation.json")
    .then((response) => response.json())
    .then((data) => {
      let currentStep = 0;
      displayStep(data, currentStep);

      function displayStep(data, stepId) {
        const step = data.find((item) => item.id === stepId);
        if (!step) return;

        chatContainer.innerHTML = "";
        buttonsContainer.innerHTML = "";

        step.message?.forEach((msg) => {
          const messageElement = document.createElement("p");
          messageElement.innerHTML = msg;
          chatContainer.appendChild(messageElement);
        });

        step.image?.forEach((imgSrc) => {
          const imgElement = document.createElement("img");
          imgElement.src = imgSrc;
          chatContainer.appendChild(imgElement);
        });

        step.buttons?.forEach((button) => {
          const buttonElement = document.createElement("button");
          buttonElement.textContent = button.text;
          buttonElement.addEventListener("click", () => {
            displayStep(data, button.next);
          });
          buttonsContainer.appendChild(buttonElement);
        });
      }
    })
    .catch((error) => console.error("Error loading conversation:", error));
}

function isMobileDevice() {
  const mobilePattern =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobilePattern.test(navigator.userAgent);
}

function blockNonMobileDevices() {
  if (!isMobileDevice()) {
    window.location.href = "/error.html";
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setTyping() {
  var lastSeen = document.getElementById("lastseen");
  lastSeen.innerText = "typing...";
  console.log("typing");
}

function setLastSeen() {
  var date = new Date();
  var lastSeen = document.getElementById("lastseen");
  lastSeen.innerText =
    "last seen today at " +
    date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  var s = document.getElementById("chatting");
  s.scrollTop = s.scrollHeight;
}

function closeFullimage() {
  var x = document.getElementById("fullScreenDP");
  if (x.style.display === "flex") {
    x.style.display = "none";
  } else {
    x.style.display = "flex";
  }
}

function openFullScreenImage(element) {
  changeImageSrc(element.src);
  var x = document.getElementById("fullScreenDP");
  if (x.style.display === "flex") {
    x.style.display = "none";
  } else {
    x.style.display = "flex";
  }
}

function changeImageSrc(newSrc) {
  const imgElement = document.getElementById("dpImage");
  if (imgElement) {
    imgElement.src = newSrc;
  }
}

function sendResponseMessage(textToSend) {
  var date = new Date();
  var myLI = document.createElement("li");
  var myDiv = document.createElement("div");
  var greendiv = document.createElement("div");
  var dateLabel = document.createElement("label");
  dateLabel.setAttribute("id", "sentlabel");
  dateLabel.id = "sentlabel";
  dateLabel.innerText = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  myDiv.setAttribute("class", "received");
  greendiv.setAttribute("class", "grey");
  greendiv.innerHTML = textToSend;
  myDiv.appendChild(greendiv);
  myLI.appendChild(myDiv);
  greendiv.appendChild(dateLabel);
  document.getElementById("listUL").appendChild(myLI);

  setTimeout(setLastSeen, 500);
}

function sendMsg(input) {
  console.log(input);
  if (input.value == "") {
    return;
  }
  var date = new Date();
  var myLI = document.createElement("li");
  var myDiv = document.createElement("div");
  var greendiv = document.createElement("div");
  var dateLabel = document.createElement("label");
  dateLabel.innerText = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  myDiv.setAttribute("class", "sent");
  greendiv.setAttribute("class", "green");
  dateLabel.setAttribute("class", "dateLabel");
  greendiv.innerText = input.value;
  myDiv.appendChild(greendiv);
  myLI.appendChild(myDiv);
  greendiv.appendChild(dateLabel);
  document.getElementById("listUL").appendChild(myLI);
  var s = document.getElementById("chatting");
  s.scrollTop = s.scrollHeight;
}

window.onload = function () {
  onLoad();
  sendResponseMessage("Welcome to Niranjana's Birthday Bash!");
};
