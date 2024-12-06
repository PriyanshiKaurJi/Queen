const axios = require("axios");

let PriyaPrefix = ["queen", "ai", ".ai"]; // Add more prefixes as needed

const axiosInstance = axios.create();

module.exports = {
  config: {
    name: "ai",
    version: "2.2.0",
    role: 0,
    category: "AI",
    author: "Priyanshi Kaur 🩶 Priyansh Rajput",
    shortDescription: "Artificial Intelligence Assistant",
    longDescription: "Ask anything to AI for intelligent answers.",
  },

  onStart: async function () {
    // Initialization logic (if required)
  },

  onChat: async function ({ message, event, args, api }) {
    const command = args[0]?.toLowerCase();

    // Help Command
    if (command === "help") {
      const helpMessage = `
      🌟 *AI Commands* 🌟
      - Prefixes: ${PriyaPrefix.join(", ")}
      - Add Prefix: addprefix <prefix>
      - AI Query: ${PriyaPrefix[0]} <your query>
      - Say Hi: hi
      `;
      await message.reply(helpMessage);
      return;
    }

    // Add Prefix Command
    if (command === "addprefix") {
      const newPrefix = args[1];
      if (newPrefix && !PriyaPrefix.includes(newPrefix)) {
        PriyaPrefix.push(newPrefix);
        await message.reply(`✅ New prefix "${newPrefix}" added successfully!`);
      } else {
        await message.reply("⚠️ Please provide a valid and unique prefix.");
      }
      return;
    }

    // Detect if a valid prefix is used
    const detectedPrefix = PriyaPrefix.find((prefix) =>
      event.body && event.body.toLowerCase().startsWith(prefix)
    );

    if (!detectedPrefix) {
      return; // Exit if no valid prefix is found
    }

    const query = event.body.substring(detectedPrefix.length).trim();

    if (!query) {
      await message.reply("✨ Queen is here to assist you! What do you need?");
      return;
    }

    // Fun greeting responses
    const greetings = [
      "Hello! How can I help you today?",
      "Greetings! What can I assist you with?",
      "Hi there! Feel free to ask me anything.",
      "How can I assist you today?",
      "Hey there! What’s on your mind?",
    ];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

    if (command === "hi") {
      await message.reply(randomGreeting);
      return;
    }

    // Prepare the AI query
    const cleanedQuery = query.replace(/\b(ai|queen|\.ai)\b/gi, "").trim();
    if (!cleanedQuery) {
      await message.reply("⚠️ Please provide a valid query for the AI.");
      return;
    }

    // Send initial waiting message
    const waitingMessage = await message.reply("🤖 Thinking... Please wait!");

    try {
      // Fetch response from your AI API
      const response = await axiosInstance.get(
        `https://priyansh-ai.onrender.com/gemini/ai?query=${encodeURIComponent(cleanedQuery)}`
      );

      const aiResponse = response.data;
      if (aiResponse) {
        // Edit the waiting message with the AI response
        await api.editMessage(aiResponse, waitingMessage.messageID);
      } else {
        throw new Error("Empty response from AI API.");
      }
    } catch (error) {
      console.error(error);
      // Update the waiting message with error information
      await api.editMessage(
        "⚠️ Oops! Something went wrong. Please try again later.",
        waitingMessage.messageID
      );
    }
  },
};