import { useState } from 'react';
import axios from 'axios';

const Chatbot = ({ diseaseText }: { diseaseText: string }) => {
    const [userMessage, setUserMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([{ text: `I see you have a ${diseaseText}. How can I help you?`, isBot: true }]);

    const sendMessage = async () => {
        if (userMessage.trim()) {
            const newChatHistory = [...chatHistory, { text: userMessage, isBot: false }];
            setChatHistory(newChatHistory);

            const historyForApi = newChatHistory.map(entry => entry.text).join(' ');

            try {
                const response = await axios.post('https://api.groq.com/v1/endpoint', {
                    prompt: `The plant has ${diseaseText}. ${historyForApi}`,
                    api_key: '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',
                });

                setChatHistory([...newChatHistory, { text: response.data.reply, isBot: true }]);
            } catch (error) {
                console.error("Error with Groq API:", error);
                setChatHistory([...newChatHistory, { text: "Sorry, I couldn't fetch a response at the moment.", isBot: true }]);
            }
        }
        setUserMessage('');
    };

    return (
        <div className="w-full max-w-lg mx-auto p-4 bg-white rounded-lg shadow-md">
            <div className="space-y-4 overflow-y-auto max-h-96">
                {chatHistory.map((entry, index) => (
                    <div key={index} className={`p-3 rounded-lg ${entry.isBot ? 'bg-gray-200 text-gray-700' : 'bg-blue-500 text-white'}`}>
                        {entry.text}
                    </div>
                ))}
            </div>
            <div className="flex items-center mt-4">
                <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Ask me about the plant disease..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={sendMessage}
                    className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Chatbot;
