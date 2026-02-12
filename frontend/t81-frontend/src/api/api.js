// This file handles all the communication with our backend server.

const API_URL = "http://localhost:8000";

/**
 * Sends text to the backend for processing into ASL glosses.
 * @param {string} text - The input text to translate.
 * @returns {Promise<Object>} - The JSON response with gloss and emotion.
 */
export const processText = async (text) => {
    try {
        // We send a POST request with the text data.
        const response = await fetch(`${API_URL}/process`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: text, is_audio: false }),
        });

        // If the server says something went wrong, we throw an error.
        if (!response.ok) {
            throw new Error("Failed to process text");
        }

        // Return the ready-to-use data.
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};
