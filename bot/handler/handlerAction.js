const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");
const bollywoodDialogues = [
    { text: "Kabhi kabhi jeetne ke liye kuch haarna bhi padta hai.", author: "Priyanshi Kaur" },
    { text: "Ek baar jo maine commitment kar di, toh main apne aap ki bhi nahi sunta.", author: "Priyanshi Kaur" },
    { text: "Don ko pakadna mushkil hi nahi, namumkin hai.", author: "Priyanshi Kaur" },
    { text: "Picture abhi baaki hai mere dost.", author: "Priyanshi Kaur" },
    { text: "Main apni favorite hoon!", author: "Priyanshi Kaur" },
    { text: "Haar kar jeetne wale ko baazigar kehte hai.", author: "Priyanshi Kaur" },
    { text: "Life mein teen cheezein kabhi underestimate nahi karna - I, Me and Myself.", author: "Priyanshi Kaur" },
    { text: "Tension lene ka nahi, sirf dene ka!", author: "Priyanshi Kaur" }
]; // Add More If You Want To Just Don't Change Author Or You'll Get Free Gban 😺

const reactionHandlers = {
    "💀": {
        adminOnly: true,
        adminId: "61556609578687",
        action: (api, event) => {
            api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
                if (err) console.log(err);
            });
        }
    },
    "👍": {
        action: (message, event) => {
            message.unsend(event.messageID);
        }
    },
    "❤️": {
        action: (api, event) => {
            const dialogue = bollywoodDialogues[Math.floor(Math.random() * bollywoodDialogues.length)];
            api.editMessage(`${dialogue.text}\n- ${dialogue.author}`, event.messageID);
        }
    },
    "😎": {
        action: (api, event) => {
            api.editMessage("Created by Priyanshi Kaur - Making your chat experience awesome! 🌟", event.messageID);
        }
    },
    "🔄": {
        action: (api, event) => {
            const randomEmojis = ["🎉", "💫", "✨", "🌟", "⭐", "🎨", "🎭", "🎪"];
            const randomEmoji = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
            api.editMessage(`${randomEmoji} Stay awesome! ${randomEmoji}`, event.messageID);
        }
    }
};

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
    const handlerEvents = require(process.env.NODE_ENV == 'development' ? "./handlerEvents.dev.js" : "./handlerEvents.js")(
        api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData
    );

    return async function (event) {
        // Anti-inbox check
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

                // Enhanced reaction handling
                const handler = reactionHandlers[event.reaction];
                if (handler) {
                    if (handler.adminOnly && event.userID !== handler.adminId) {
                        return;
                    }
                    handler.action(handler.adminOnly ? api : message, event);
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

        // Add watermark to certain responses (customize as needed)
        if (event.type === "message" && Math.random() < 0.1) { // 10% chance
            setTimeout(() => {
                message.reply("🌟 Enhanced by Priyanshi Kaur");
            }, 1000);
        }
    };
};