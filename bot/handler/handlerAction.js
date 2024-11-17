const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

const bollywoodDialogues = [
  "Kabhi kabhi jeetne ke liye kuch haarna bhi padta hai. - DDLJ",
  "Don ko pakadna mushkil hi nahi, namumkin hai. - Don",
  "Picture abhi baaki hai mere dost. - Om Shanti Om",
  "Main apni favorite hoon! - Jab We Met",
  "Haar kar jeetne wale ko baazigar kehte hai. - Baazigar",
  "Life mein teen cheezein kabhi underestimate nahi karna - I, Me and Myself. - Dhamaal",
  "Tension lene ka nahi, sirf dene ka! - Hera Pheri",
  "Ye dosti hum nahi todenge - Sholay"
];

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
    const handlerEvents = require(process.env.NODE_ENV == 'development' ? "./handlerEvents.dev.js" : "./handlerEvents.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

    return async function (event) {
        if (
            global.GoatBot.config.antiInbox == true &&
            (event.senderID == event.threadID || event.userID == event.senderID || event.isGroup == false) &&
            (event.senderID || event.userID || event.isGroup == false)
        )
            return;

        const message = createFuncMessage(api, event);

        await handlerCheckDB(usersData, threadsData, event);
        const handlerChat = await handlerEvents(event, message);
        if (!handlerChat)
            return;

        const {
            onAnyEvent, onFirstChat, onStart, onChat,
            onReply, onEvent, handlerEvent, onReaction,
            typ, presence, read_receipt
        } = handlerChat;

        onAnyEvent();
        switch (event.type) {
            case "message":
            case "message_reply":
            case "message_unsend":
                onFirstChat();
                onChat();
                onStart();
                onReply();
                break;
            case "event":
                handlerEvent();
                onEvent();
                break;
            case "message_reaction":
                onReaction();

                // Admin kick with skull reaction
                if (event.reaction == "💀") {
                    if (event.userID == "61556609578687") { // Replace with your admin ID
                        api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
                            if (err) return console.log(err);
                        });
                    }
                }

                // Delete message with thumbs up
                if (event.reaction == "👍") {
                    message.unsend(event.messageID);
                }

                // Edit message with random Bollywood dialogue (heart reaction)
                if (event.reaction == "❤️") {
                    const randomDialogue = bollywoodDialogues[Math.floor(Math.random() * bollywoodDialogues.length)];
                    api.editMessage(`${randomDialogue}\n\n- Enhanced by Priyanshi Kaur ✨`, event.messageID, (err) => {
                        if (err) console.log(err);
                    });
                }

                // Add credit message (star reaction)
                if (event.reaction == "⭐") {
                    api.editMessage("Created with ❤️ by Priyanshi Kaur\nMaking your chats more magical! ✨", event.messageID, (err) => {
                        if (err) console.log(err);
                    });
                }

                // Add random motivational message (fire reaction)
                if (event.reaction == "🔥") {
                    const motivationalMessages = [
                        "You're awesome! Keep shining! ✨",
                        "Success is your destiny! 🌟",
                        "Keep rocking! You've got this! 💫",
                        "Stay positive, stay fighting! ⚡",
                        "Your potential is unlimited! 🎯"
                    ];
                    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
                    api.editMessage(`${randomMessage}\n\n- Priyanshi's Bot 🤖`, event.messageID, (err) => {
                        if (err) console.log(err);
                    });
                }
                break;

            case "typ":
                typ();
                break;
            case "presence":
                presence();
                break;
            case "read_receipt":
                read_receipt();
                break;
            default:
                break;
        }
    };
};