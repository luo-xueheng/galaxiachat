# Galaxia Chat

Galaxia Chat is a modern real-time chat application built with Next.js and Ant Design, supporting both private and group conversations. It features instant messaging, emoji reactions, image sharing, message replies, read receipts, and advanced message search/filter capabilities.

## Features

- **Real-time Messaging:** Instant communication via WebSocket, supporting text, emoji, and image messages.
- **Private & Group Chat:** Seamless switching between one-on-one and group conversations.
- **Message Replies:** Reply to specific messages and view reply threads.
- **Emoji & Image Support:** Send emojis and images directly in chat.
- **Read Receipts:** See who has read your messages, including detailed read status in group chats.
- **Message Search & Filter:** Search chat history by sender and date range.
- **Group Management:** Manage group members and view group details.
- **Responsive UI:** Built with Ant Design for a clean and user-friendly interface.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Ant Design
- **State Management:** React Hooks
- **Real-time Communication:** WebSocket
- **Backend API:** RESTful endpoints (see `/api` and backend URLs in code)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

## Project Structure

- `/app/mainpage/chat/[chatId]/page.tsx` — Main chat page with all chat logic and UI.
- `/api/` — API endpoints for user, conversation, and message management.

## Usage

- Log in to access chat features.
- Select a conversation to start chatting.
- Use the input area to send text, emojis, or images.
- Right-click on messages to reply or delete.
- Use the menu to search chat history or manage group chats.

## License

This project is for educational and demonstration
