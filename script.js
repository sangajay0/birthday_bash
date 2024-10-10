function onLoad() {
    console.log("Page loaded");
    setLastSeen();

    const chatContainer = document.getElementById("chatting");
    const buttonsContainer = document.getElementById("button-container");

    fetch("conversation.json")
        .then((response) => response.json())
        .then((data) => {
            let currentStep = 0;

            function displayMessage(step, message, currIdx, ttlSize) {
                hideButtons(); // Hide buttons initially
                setTyping();
                setTimeout(() => {
                    if (step.image) {
                        console.log("Images array: ", step.image); // Log the images array
                        step.image.forEach((imgUrl) => {
                            console.log(`Image URL: ${imgUrl}`); // Log the image URL to the console
                            sendMsg(`<img src='${imgUrl}' style='max-width: 100%; height: auto; margin-top: 10px;'>`);
                        });
                    } else {
                        sendResponseMessage(message);
                    }

                    if (currIdx + 1 === ttlSize && step.buttons) {
                        displayButtons(step.buttons); // Show buttons for user interaction
                    }
                }, 1500);
            }

            function displayButtons(buttons) {
                buttonsContainer.innerHTML = "";
                buttons.forEach((button) => {
                    const buttonElement = document.createElement("button");
                    buttonElement.className = "message-button";
                    buttonElement.textContent = button.text;

                    buttonElement.addEventListener("click", () => {
                        currentStep = button.next; // Move to the next step
                        const step = data[currentStep - 1]; // Get the next step

                        if (step.userInitiated) {
                            sendMsg(button.text); // Send text if the user initiated
                        }

                        nextStep(); // Proceed to the next step
                    });

                    buttonsContainer.appendChild(buttonElement);
                });
            }

            function hideButtons() {
                buttonsContainer.innerHTML = "";
            }

            function nextStep() {
                if (currentStep < data.length) {
                    const step = data[currentStep];

                    // Check for user-initiated actions
                    if (step.userInitiated) {
                        if (step.buttons) {
                            displayButtons(step.buttons);
                        }
                    } else {
                        // Automatic response from Niranjana
                        if (step.message) {
                            step.message.forEach((msg, idx) => {
                                setTimeout(() => {
                                    displayMessage(step, msg, idx, step.message.length);
                                    if (idx + 1 === step.message.length) {
                                        currentStep++;
                                        nextStep();
                                    }
                                }, (idx + 1) * 1500);
                            });
                        }

                        // Handle images separately, if any
                        if (step.image) {
                            step.image.forEach((imgUrl, idx) => {
                                setTimeout(() => {
                                    sendMsg(`<img src='${imgUrl}' style='max-width: 100%; height: auto;'>`);
                                    currentStep++;
                                    nextStep();
                                }, (idx + 1) * 1500);
                            });
                        }
                    }
                }
            }

            console.log("Started Conversation");
            nextStep(); // Start the conversation
        })
        .catch((error) => {
            console.error("Error loading JSON data:", error);
        });
}

function isMobileDevice() {
    const mobilePattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
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
    const lastSeen = document.getElementById("lastseen");
    lastSeen.innerText = "typing...";
}

function setLastSeen() {
    const date = new Date();
    const lastSeen = document.getElementById("lastseen");
    lastSeen.innerText = "last seen today at " + date.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
}

function closeFullImage() {
    const x = document.getElementById("fullScreenDP");
    x.style.display = x.style.display === "flex" ? "none" : "flex";
}

function openFullScreenImage(element) {
    changeImageSrc(element.src);
    const x = document.getElementById("fullScreenDP");
    x.style.display = "flex"; // Open the fullscreen image
}

function changeImageSrc(newSrc) {
    const imgElement = document.getElementById("dpImage");
    if (imgElement) {
        imgElement.src = newSrc;
    }
}

function sendMessage(textToSend, type = 'received') {
    const date = new Date();
    const myLI = document.createElement("li");
    const myDiv = document.createElement("div");
    const greendiv = document.createElement("div");
    const dateLabel = document.createElement("label");

    dateLabel.className = "dateLabel";
    dateLabel.innerText = date.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });

    myDiv.className = type === 'sent' ? "sent" : "received";
    greendiv.className = type === 'sent' ? "green" : "grey";
    greendiv.innerHTML = textToSend; // Use innerHTML to support HTML content

    myDiv.appendChild(greendiv);
    myLI.appendChild(myDiv);
    greendiv.appendChild(dateLabel);
    document.getElementById("listUL").appendChild(myLI);

    setLastSeen();
}

function sendResponseMessage(textToSend) {
    sendMessage(textToSend, 'received');
}

function sendMsg(input) {
    sendMessage(input, 'sent');
}

window.onload = function () {
    onLoad();
    sendResponseMessage("Welcome to Niranjana's Birthday Bash!");
};
