
export interface MissedMessages {
    messages: MessageData[];
    hasNewMessages?: boolean;
}

export interface MessageData {
    from: string;
    body: string;
    timestamp: number;
}