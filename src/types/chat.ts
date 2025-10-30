export interface Chat {
  id: string;
  title: string;
  userId: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  files?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  messageId: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

export interface CreateChatRequest {
  title?: string;
  model?: string;
}

export interface SendMessageRequest {
  chatId: string;
  content: string;
  files?: string[];
}
