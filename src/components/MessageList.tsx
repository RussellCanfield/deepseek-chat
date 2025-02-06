import { Message } from "../contexts/ThreadContext";
import { Message as ChatMessage } from "./Message";

const MessageList: React.FC<{ messages: Message[] }> = ({ messages }) => {
    return (
        <div className="space-y-4 mt-4">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} class="max-w-[80%]`}
                >
                    <div
                        className={`rounded-lg ${message.role === 'user'
                            ? 'bg-blue-600 text-white ml-4'
                            : 'bg-gray-100 text-gray-900 mr-4'
                            }`}
                    >
                        <ChatMessage id={message.id} content={message.content} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export { MessageList }