# Quick Setup Guide - Talkify

## Prerequisites Checklist

- [ ] Node.js (v16+) installed
- [ ] MongoDB running (local or Atlas)
- [ ] OpenAI/OpenRouter API Key (for translation)
- [ ] Expo CLI installed (`npm install -g expo-cli`)

## Step-by-Step Setup

### 1. Backend Setup (5 minutes)

```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:

```env
MONGO_URL=mongodb://localhost:27017/talkify
PORT=5000
CLIENT_URL=http://localhost:8081
JWT_SECRET=change_this_to_a_random_string_at_least_32_characters_long
OPENAI_API_KEY=your_api-key
NODE_ENV=development
```

**Important:** 
- Replace `JWT_SECRET` with a random string (e.g., use `openssl rand -base64 32`)
- Get your OpenAI/OpenRouter API key from [OpenRouter](https://openrouter.ai/keys)
- Or use the provided API key in the .env file

Start MongoDB (if running locally):
```bash
# Windows - usually starts automatically
# macOS/Linux
sudo systemctl start mongod
```

Start backend:
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected
🚀 Server running on port 5000
📡 Socket.io server ready
```

### 2. Frontend Setup (3 minutes)

Open a new terminal:

```bash
cd frontend
npm install
```

Start frontend:
```bash
npm start
```

This opens Expo DevTools. Press:
- `a` for Android emulator
- `i` for iOS simulator  
- `w` for web browser
- Scan QR code for physical device

## Testing on Physical Device

### For Android Device:
1. Find your computer's IP:
   - Windows: Run `ipconfig` → Look for IPv4 Address
   - macOS/Linux: Run `ifconfig` or `ip addr`

2. Update `frontend/constants/config.ts`:
   ```typescript
   if (Platform.OS === 'android') {
     return 'http://YOUR_IP_ADDRESS:5000';  // e.g., 'http://192.168.1.100:5000'
   }
   ```

### For iOS Device:
1. Find your computer's IP (same as above)
2. Update `frontend/constants/config.ts`:
   ```typescript
   else if (Platform.OS === 'ios') {
     return 'http://YOUR_IP_ADDRESS:5000';
   }
   ```

**Important:** Device and computer must be on the same Wi-Fi network!

## Quick Test

1. Register a new user in the app
2. Register another user (use different device/emulator or web)
3. Search for the first user
4. Start a chat
5. Send a message - it should auto-translate!

## Troubleshooting

### Backend won't start:
- ✅ Check MongoDB is running
- ✅ Verify `.env` file exists and has correct values
- ✅ Check port 5000 is not in use
- ✅ Verify JWT_SECRET is set

### Frontend can't connect:
- ✅ Check backend is running on port 5000
- ✅ For physical device, verify IP address is correct
- ✅ Ensure device and computer on same network
- ✅ Check firewall isn't blocking port 5000

### Socket connection fails:
- ✅ Verify token is valid (re-login if needed)
- ✅ Check SOCKET_URL in config.ts
- ✅ Verify CORS settings in backend

## Project Structure

```
Talkify/
├── backend/          # Node.js + Express + Socket.io
│   ├── .env         # ← Create this file!
│   └── server.js
└── frontend/        # React Native + Expo
    └── constants/
        └── config.ts  # ← Update IP here for physical devices
```

## Commands Reference

### Backend
```bash
cd backend
npm install          # Install dependencies
npm run dev         # Start development server
npm start           # Start production server
```

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm start            # Start Expo dev server
npm run android      # Start Android emulator
npm run ios          # Start iOS simulator
npm run web          # Start web version
```

## Need Help?

1. Check the main [README.md](./README.md) for detailed documentation
2. Review error messages in console
3. Check MongoDB connection string
4. Verify translation is working (LibreTranslate is free)
5. Check backend logs for detailed errors

---

**Ready to chat! 🚀💬**

