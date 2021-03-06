// Initialize letiables
let $window = $(window);
let $msgMinimize = $(".msg__minimize");

let $form = $(".formArea"); // Details form
let $Input = $(".inputFields"); //Input fields in form
let $nameInput = $(".nameInput"); //Name input
let $emailInput = $(".emailInput"); //Email input

let $chatArea = $(".chatArea"); //Chat page after filling form
let $messages = $(".messages"); //Message area
let $newMsg = $(".msg__push--new"); //Dummy to push new msgs
let $oldMsg = $(".msg__push--old"); //Dummy to push msg history
let $Typing = $(".typing"); //Typing notification
let $inputMessage = $(".inputMessage"); //Text area to input msg
let $contentArea = $(".contentArea"); //Widget box

let socket = io(); //io socket
let typing = false; //Boolean to check if user is typing
let timeout = undefined; //Timeout to monitor typing
let id = localStorage.getItem("roomID"); //Room ID in localstorage
let active = sessionStorage.getItem("active"); //Check if chat has been opened.

function formatDate(date) {
    return {
        getMonthFormat: (date.getMonth() + 1).toString().padStart(2, "0"),
        getDateFormat: date.getDate().toString().padStart(2, "0"),
        getHoursFormat: date.getHours().toString().padStart(2, "0"),
        getMinutesFormat: date.getMinutes().toString().padStart(2, "0"),
    };
}

function timeoutFunction() {
    typing = false;
    socket.emit("typing", {
        isTyping: false,
        roomID: id,
        person: "Client",
    });
}

function sendMessage() {
    let msg = $inputMessage.val().trim();
    // Prevent markup from being injected into the message
    msg = cleanInput(msg);
    // if there is a non-empty msg
    if (msg) {
        $inputMessage.val("");
        let timeStamp = new Date().getTime();
        // tell server to execute 'new msg' and send along one parameter
        socket.emit("chat message", {
            roomID: "null",
            msg,
            timeStamp,
            asRead: "false",
        });
        let $messageBodyDiv = $(
            `<div class="msg__b">${msg}
                <span class="timestamp">${
                    formatDate(new Date()).getHoursFormat
                }:${formatDate(new Date()).getMinutesFormat}
                </span>
            </div>`
        ).insertBefore($newMsg);
        $messages[0].scrollTop = $messages[0].scrollHeight;
    }
}

function addMessages(data, getMore) {
    let sender;
    let date = new Date(data["when"]);
    if (data["who"]) sender = "msg__a";
    else sender = "msg__b";
    let $messageBodyDiv = $(
        `<div class="
            ${sender}">${data["what"]}
            <span class="timestamp">${formatDate(date).getHoursFormat}:${
            formatDate(date).getMinutesFormat
        }</span></div>`
    );
    if (getMore) {
        $messageBodyDiv.insertAfter($oldMsg);
        $messages[0].scrollTop += $messageBodyDiv.outerHeight();
    } else {
        $messageBodyDiv.insertBefore($newMsg);
        $messages[0].scrollTop = $messages[0].scrollHeight;
    }
}

// Prevents input from having injected markup
function cleanInput(input) {
    return $("<div/>").text(input).text();
}
//generate roomID
function uuid() {
    let temp_url = URL.createObjectURL(new Blob()); //create new url with blob
    let uuid = temp_url.toString();
    URL.revokeObjectURL(temp_url);
    return uuid.substr(uuid.lastIndexOf("/") + 1); // remove prefix (e.g. blob:null/, blob:www.test.com/, ...)
}

if (active && id) {
    // $msgMinimize.hide();
    $msgMinimize.show();
    $form.hide();
    $chatArea.show();
    socket.emit("add user", {
        isNewUser: false,
        roomID: id,
    });
    // $contentArea.show();
    $contentArea.hide();
} else if (userClient) {
    $msgMinimize.show();
    $form.hide();
    $chatArea.show();
    socket.emit("add user", {
        isNewUser: true,
        roomID: uuid(),
        name: userClient.name,
        email: userClient.email,
    });
    $contentArea.hide();
}

$msgMinimize.click(function () {
    $contentArea.slideToggle("slow");
    $msgMinimize.hide();
    if (id != null && !active) {
        socket.emit("add user", {
            isNewUser: false,
            roomID: id,
        });
        $form.hide();
        $chatArea.show();
        $inputMessage.focus();
        sessionStorage.setItem("active", true);
        active = true;
    }
});

$(".msg__head").click(function () {
    $contentArea.slideToggle("slow");
    $msgMinimize.show(1100);
});

// Send Messages
$Input.submit(function () {
    $form.hide();
    $chatArea.show();
    $inputMessage.focus();
    sessionStorage.setItem("active", true);
    socket.emit("add user", {
        isNewUser: true,
        roomID: uuid(),
        name: $nameInput.val().trim(),
        email: $emailInput.val().trim(),
    });
});

$inputMessage.keypress(function (event) {
    if (event.which !== 13) {
        if (typing === false && $inputMessage.is(":focus")) {
            typing = true;
            socket.emit("typing", {
                isTyping: true,
                roomID: id,
                person: "Client",
            });
        } else {
            clearTimeout(timeout);
            timeout = setTimeout(timeoutFunction, 2000);
        }
    } else {
        sendMessage();
        clearTimeout(timeout);
        timeoutFunction();
    }
});

$messages.on("scroll", function () {
    if ($messages.scrollTop() == 0) socket.emit("more messages", {});
});

socket
    .on("roomID", function (roomID) {
        id = roomID;
        localStorage.setItem("roomID", roomID);
    })
    .on("chat message", function (data) {
        let sender;
        let date = new Date(data.msg[0].when);
        if (data.isAdmin) sender = "msg__a";
        else sender = "msg__b";
        let $messageBodyDiv = $(
            `<div class="
                ${sender}">${data.msg[0].what}
                <span class="timestamp">${formatDate(date).getHoursFormat}:${
                formatDate(date).getMinutesFormat
            } | ${formatDate(date).getDateFormat}/${
                formatDate(date).getMonthFormat
            }</span></div>`
        ).insertBefore($newMsg);
        $messages[0].scrollTop = $messages[0].scrollHeight;
    })
    .on("typing", function (data) {
        if (data.isTyping) $Typing.append("Admin is typing...");
        else $Typing.text("");
    })
    .on("chat history", function (data) {
        let len = data.history.length;
        for (let i = len - 1; i >= 0; i--) {
            addMessages(data.history[i], false);
        }
    })
    .on("more chat history", function (data) {
        let len = data.history.length;
        for (let i = 0; i < len; i++) {
            addMessages(data.history[i], true);
        }
    })
    .on("log message", function (text) {
        let time = "" + new Date();
        let $messageDiv = $(
            '<div class="msg__a">' +
                text +
                '<span class="timestamp">' +
                time.toLocaleString().substr(15, 6) +
                "</span></div>"
        ).insertBefore($newMsg);
        $messages[0].scrollTop = $messages[0].scrollHeight;
    })
    .on("disconnect", function () {
        console.log("Disconnected!");
        $inputMessage.prop("disabled", true);
        $inputMessage.prop("placeholder", "Connection Lost! Reconnecting..");
    })
    .on("reconnect_failed", function () {
        console.log("Reconnection Failed!");
        $inputMessage.prop(
            "placeholder",
            "No active connection. Please refresh page."
        );
    })
    .on("reconnect", function () {
        setTimeout(function () {
            console.log("Reconnected!");
            $inputMessage.prop("disabled", false);
            $inputMessage.prop("placeholder", "Type here...");
            if (active && id)
                socket.emit("add user", {
                    isNewUser: false,
                    roomID: id,
                });
        }, 4000);
    });
