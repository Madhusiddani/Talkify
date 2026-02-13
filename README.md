# Talkify - Real-Time Multi-Language Chat Application

Talkify is a real-time chat application built with React Native (Expo) and Node.js that enables users to communicate in their preferred language with automatic translation.

## Features

- 🔐 **User Authentication** - Secure registration and login
- 💬 **Real-Time Messaging** - Instant messaging using Socket.io
- 🌍 **Multi-Language Support** - Automatic translation between 20+ languages
- 📱 **Cross-Platform** - Works on Android, iOS, and Web
- 👥 **User Management** - Search and connect with other users
- 📊 **Message Status** - Sent, delivered, and read receipts
- ⚡ **Typing Indicators** - Real-time typing status
- 🎨 **Modern UI** - Beautiful and responsive design

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Socket.io** for real-time communication
- **JWT** for authentication
- **OpenAI via OpenRouter** for AI-powered translations (handles transliterated text)

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **Expo Router** for navigation
- **Socket.io Client** for real-time features
- **AsyncStorage** for local storage

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Expo CLI** (`npm install -g expo-cli`)
- **OpenAI/OpenRouter API Key** (for AI-powered translation)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Talkify
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
MONGO_URL=mongodb://localhost:27017/talkify

# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:8081

# JWT Secret (Change this to a random string in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# OpenAI/OpenRouter API Key (Required for translation)
# Get your API key from: https://openrouter.ai/keys
# Or use OpenAI directly: https://platform.openai.com/api-keys
OPENAI_API_KEY=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

# Environment
NODE_ENV=development
```

**Important Notes:**
- Replace `your_super_secret_jwt_key_change_this_in_production` with a strong random string for JWT_SECRET
- Get your OpenAI/OpenRouter API key from [OpenRouter](https://openrouter.ai/keys) or [OpenAI Platform](https://platform.openai.com/api-keys)
- For MongoDB Atlas, replace the MONGO_URL with your Atlas connection string

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

## Running the Application

### Start MongoDB

Make sure MongoDB is running on your system:

```bash
# For Windows (if installed as a service, it should start automatically)
# Or use:
mongod

# For macOS/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### Start Backend Server

In the `backend` directory:

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The backend server will start on `http://localhost:5000`

You should see:
```
✅ MongoDB Connected
🚀 Server running on port 5000
📡 Socket.io server ready
```

### Start Frontend Application

In the `frontend` directory:

```bash
# Start Expo development server
npm start

# Or use specific platform commands:
npm run android    # For Android
npm run ios        # For iOS
npm run web        # For Web
```

This will open the Expo developer tools in your browser. You can:
- Press `a` to open Android emulator
- Press `i` to open iOS simulator
- Scan QR code with Expo Go app on your physical device
- Press `w` to open in web browser

## Configuration for Physical Devices

If you're testing on a physical device, you need to update the API URL:

### For Android Physical Device:
1. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - macOS/Linux: `ifconfig` or `ip addr`
2. Update `frontend/constants/config.ts`:
   ```typescript
   if (Platform.OS === 'android') {
     // For physical device, use your computer's IP
     return 'http://YOUR_IP_ADDRESS:5000';
     // Example: 'http://192.168.1.100:5000'
   }
   ```

### For iOS Physical Device:
1. Use your computer's IP address (same as above)
2. Update `frontend/constants/config.ts`:
   ```typescript
   else if (Platform.OS === 'ios') {
     // For physical device, use your computer's IP
     return 'http://YOUR_IP_ADDRESS:5000';
   }
   ```

**Important:** Make sure your device and computer are on the same Wi-Fi network.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users` - Get all users (protected)
- `GET /api/users/search?query=...` - Search users (protected)
- `GET /api/users/:userId` - Get user by ID (protected)
- `PATCH /api/users/profile` - Update profile (protected)
- `PATCH /api/users/status` - Update status (protected)

### Messages
- `POST /api/message/send` - Send a message (protected)
- `GET /api/message/messages?conversationId=...` - Get messages (protected)
- `GET /api/message/conversations` - Get all conversations (protected)
- `GET /api/message/conversations/:conversationId` - Get conversation (protected)
- `PATCH /api/message/conversations/:conversationId/read` - Mark as read (protected)

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
- `userTyping` - User typing indicator
- `messageRead` - Message read confirmation
- `conversationUpdated` - Conversation updated
- `userOnline` - User came online
- `userOffline` - User went offline
- `error` - Error occurred

## Project Structure

```
Talkify/
├── backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   ├── messageController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT authentication
│   ├── models/
│   │   ├── User.js
│   │   ├── Message.js
│   │   └── Conversation.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── MessageRoutes.js
│   │   ├── userRoutes.js
│   │   └── translateRoutes.js
│   ├── services/
│   │   └── translateService.js
│   ├── server.js              # Main server file
│   ├── package.json
│   └── .env                   # Environment variables (create this)
│
└── frontend/
    ├── app/                   # Expo Router pages
    │   ├── (tabs)/           # Tab navigation
    │   ├── chat/             # Chat screens
    │   ├── index.tsx         # Root screen
    │   ├── login.tsx
    │   └── register.tsx
    ├── components/           # Reusable components
    ├── contexts/
    │   ├── AuthContext.tsx   # Authentication context
    │   └── SocketContext.tsx # Socket.io context
    ├── constants/
    │   └── config.ts         # API configuration
    ├── services/
    │   └── api.ts            # API service
    └── package.json
```

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
- Make sure MongoDB is running
- Check if MONGO_URL in `.env` is correct
- For MongoDB Atlas, ensure your IP is whitelisted

**Port Already in Use:**
- Change PORT in `.env` to a different port (e.g., 5001)
- Or kill the process using port 5000

**JWT Secret Error:**
- Make sure JWT_SECRET is set in `.env`
- Use a strong random string (at least 32 characters)

**Translation API Error:**
- Verify your OPENAI_API_KEY is set correctly in `.env`
- Check your API key has sufficient credits
- Ensure internet connection is stable
- If errors persist, the app falls back to original text

### Frontend Issues

**Cannot Connect to Backend:**
- Check if backend is running on correct port
- Verify API_BASE_URL in `frontend/constants/config.ts`
- For physical devices, ensure correct IP address
- Make sure both devices are on same network

**Socket Connection Failed:**
- Check if token is valid
- Verify SOCKET_URL in `frontend/constants/config.ts`
- Check CORS settings in backend

**Expo Build Errors:**
- Clear cache: `expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Update Expo: `npm install -g expo-cli@latest`

## Development Commands

### Backend
```bash
cd backend
npm start          # Start production server
npm run dev        # Start development server with nodemon
```

### Frontend
```bash
cd frontend
npm start          # Start Expo dev server
npm run android    # Start Android emulator
npm run ios        # Start iOS simulator
npm run web        # Start web version
npm run lint       # Run ESLint
```

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Use a secure JWT_SECRET
3. Set up proper MongoDB Atlas connection
4. Deploy to services like Heroku, Railway, or AWS

### Frontend
1. Update API_BASE_URL to production URL in `config.ts`
2. Build for production:
   ```bash
   expo build:android
   expo build:ios
   ```
3. Or use EAS Build:
   ```bash
   eas build --platform android
   eas build --platform ios
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the code comments for implementation details

## Acknowledgments

- OpenAI via OpenRouter for AI-powered translation services
- Expo team for the amazing React Native framework
- Socket.io for real-time communication
- MongoDB for database services

---

**Happy Chatting! 🚀💬**

