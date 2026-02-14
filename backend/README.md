# Talkify Backend API

A WhatsApp-like chat application with automatic language translation built with Node.js, Express, Socket.io, and MongoDB.

## Features

- 🔐 User Authentication (JWT-based)
- 💬 Real-time messaging via Socket.io
- 🌍 Automatic language translation using OpenAI via OpenRouter (handles transliterated text)
- 📱 Conversation management
- 👥 User search and profile management
- ✅ Message status tracking (sent, delivered, read)
- 🔔 Typing indicators
- 📊 Unread message counts

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- OpenAI/OpenRouter API key (for AI-powered translation)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
PORT=5000
CLIENT_URL=http://localhost:3000
MONGO_URL=mongodb://localhost:27017/talkify
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_api_key
```

3. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users` - Get all users (protected)
- `GET /api/users/search?query=username` - Search users (protected)
- `GET /api/users/:userId` - Get user by ID (protected)
- `PATCH /api/users/profile` - Update user profile (protected)
- `PATCH /api/users/status` - Update user status (protected)

### Messages
- `POST /api/message/send` - Send a message (protected)
- `GET /api/message/messages?conversationId=xxx&page=1&limit=50` - Get messages (protected)
- `PATCH /api/message/messages/:messageId/status` - Update message status (protected)

### Conversations
- `GET /api/message/conversations` - Get all conversations (protected)
- `GET /api/message/conversations/:conversationId` - Get specific conversation (protected)
- `PATCH /api/message/conversations/:conversationId/read` - Mark conversation as read (protected)

### Translation
- `GET /api/translate/languages` - Get supported languages (protected)

## Socket.io Events

### Client → Server
- `sendMessage` - Send a message
- `typing` - Send typing indicator
- `markAsRead` - Mark message as read

### Server → Client
- `messageSent` - Message sent confirmation
- `newMessage` - New message received
- `messageRead` - Message read notification
- `conversationUpdated` - Conversation updated
- `userTyping` - User typing indicator
- `userOnline` - User came online
- `userOffline` - User went offline
- `error` - Error occurred

## How Translation Works

1. User A sends a message in their preferred language (e.g., Telugu)
2. The system detects the source language automatically
3. The message is translated to User B's preferred language (e.g., English)
4. User B receives the message in their preferred language
5. Both original and translated text are stored in the database

## Database Models

### User
- username, email, password
- preferredLanguage
- profilePicture, status, lastSeen
- socketId

### Message
- sender, receiver (User references)
- originalText, translatedText
- sourceLanguage, targetLanguage
- conversationId
- status (sent, delivered, read)
- messageType (text, image, file, audio)

### Conversation
- participants (array of User IDs)
- lastMessage, lastMessageAt
- unreadCount (Map of userId → count)

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

For Socket.io, pass the token in the handshake:
```javascript
socket = io(url, {
  auth: {
    token: 'your_jwt_token'
  }
});
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## License

ISC

