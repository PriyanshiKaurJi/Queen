const { google } = require("googleapis");
const axios = require("axios");

module.exports = {
    config: {
        name: "sing",
        version: "1.3",
        author: "Priyanshi Kaur",
        countDown: 5,
        role: 0,
        shortDescription: "Download songs with details",
        longDescription: "Search and download songs with detailed information such as artist, views, and release date",
        category: "media",
        guide: "{pn} <song name>"
    },
    onStart: async function ({ api, event, args }) {
        const youtube = google.youtube({
            version: "v3",
            auth: "AIzaSyDw2dm4V9TTsPmD2gdoScIuV68-GBDn9uE"
        });

        try {
            const songName = args.join(" ").trim();
            if (!songName) {
                return api.sendMessage("❌ Please provide a valid song name.", event.threadID);
            }

            api.sendMessage("⏳ Searching for your request...", event.threadID);

            const searchResponse = await youtube.search.list({
                part: ["id", "snippet"],
                q: songName,
                maxResults: 1,
                type: "video"
            });

            const result = searchResponse.data.items[0];
            if (!result) {
                return api.sendMessage("❌ No results found.", event.threadID);
            }

            const videoId = result.id.videoId;
            const videoDetails = await youtube.videos.list({
                part: ["snippet", "statistics", "contentDetails"],
                id: [videoId]
            });

            const video = videoDetails.data.items[0];
            if (!video) {
                return api.sendMessage("❌ Could not retrieve video details.", event.threadID);
            }

            const downloadApi = `https://priyansh-ai.onrender.com/youtube?id=${videoId}&apikey=priyansh-here`;
            const downloadResponse = await axios.get(downloadApi);
            const downloadUrl = downloadResponse.data?.downloadUrl;

            if (!downloadUrl) {
                return api.sendMessage("❌ Could not generate download URL.", event.threadID);
            }

            const formatNumber = (num) => {
                if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
                if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
                if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
                return num.toString();
            };

            const formatDuration = (duration) => {
                const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
                const hours = (match[1] || "").slice(0, -1);
                const minutes = (match[2] || "").slice(0, -1);
                const seconds = (match[3] || "").slice(0, -1);

                let result = "";
                if (hours) result += `${hours}:`;
                result += `${minutes.padStart(2, "0")}:`;
                result += seconds.padStart(2, "0");
                return result;
            };

            const publishDate = new Date(video.snippet.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });

            const messageBody = `🎵 Title: ${video.snippet.title}\n` +
                `👤 Artist: ${video.snippet.channelTitle}\n` +
                `⏱️ Duration: ${formatDuration(video.contentDetails.duration)}\n` +
                `👁️ Views: ${formatNumber(video.statistics.viewCount)}\n` +
                `👍 Likes: ${formatNumber(video.statistics.likeCount)}\n` +
                `📅 Released: ${publishDate}\n\n` +
                `🎵 Downloading Audio...\n🔗 Download Link: ${downloadUrl}`;

            api.sendMessage(messageBody, event.threadID);
        } catch (error) {
            console.error(error);
            api.sendMessage(`❌ An error occurred: ${error.message}`, event.threadID);
        }
    }
};