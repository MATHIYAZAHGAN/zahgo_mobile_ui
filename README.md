# 🚀 ZAH Seller AI - AI-Powered Reseller Catalog Platform

தமிழில் செயல்படும் வெற்றிகரமான விற்பனையாளர் AI தளம்

An intelligent mobile platform that helps resellers create professional product catalogs using AI-powered image processing, voice recognition, and multilingual support (Tamil & English).

## ✨ Features

- 📸 **AI Product Studio** - Professional background removal and image enhancement
- 🎤 **Voice-to-Catalog** - Speak product details in Tamil or English
- 🤖 **Smart AI Assistant** - Guided product information extraction
- 📦 **Product Management** - Full CRUD operations for product catalog
- 🌐 **Multilingual** - Tamil and English language support
- 🔐 **Secure Authentication** - JWT-based user authentication
- ☁️ **Cloud Database** - MongoDB Atlas for data persistence

## 🏗️ Project Structure

```
ZAH APP/
├── apps/
│   └── mobile/              # React Native Expo mobile app
│       ├── src/
│       │   ├── screens/     # UI screens
│       │   ├── components/  # Reusable components
│       │   ├── services/    # API and AI services
│       │   ├── store/       # Zustand state management
│       │   ├── config/      # Configuration files
│       │   └── types/       # TypeScript types
│       ├── app.json         # Expo configuration
│       ├── eas.json         # EAS Build configuration
│       └── package.json     # Dependencies
│
└── services/
    └── api/                 # .NET 8 Backend API
        └── src/
            ├── API/         # Web API controllers
            ├── Application/ # Application layer
            ├── Domain/      # Domain entities
            ├── Infrastructure/ # Data access, AI services
            └── Shared/      # Shared DTOs

```

## 🛠️ Technology Stack

### Mobile App
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Zustand
- **UI**: React Native components with custom theming
- **Image Processing**: Expo Image Picker, Remove.bg API
- **Voice Recognition**: Expo AV & Audio

### Backend API
- **Framework**: ASP.NET Core 8.0 (C#)
- **Database**: MongoDB Atlas
- **Authentication**: JWT Bearer tokens
- **AI Services**: 
  - Google Gemini for image analysis
  - Remove.bg for background removal
  - Custom AI parsers for product extraction

## 📋 Prerequisites

### For Mobile Development:
- Node.js >= 20.19.4
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android builds) or Xcode (for iOS)

### For Backend Development:
- .NET 8.0 SDK
- MongoDB Atlas account
- Visual Studio 2022 or VS Code

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/zah-seller-ai.git
cd zah-seller-ai
```

### 2. Setup Backend

```bash
cd services/api/src/API

# Copy environment template
copy .env.example .env

# Edit .env with your actual API keys and credentials
# - GEMINI_API_KEY
# - REMOVEBG_API_KEY
# - MONGODB_CONNECTION_STRING
# - JWT_SECRET

# Restore dependencies
dotnet restore

# Run the API
dotnet run
```

Backend will start on `http://localhost:5000`

### 3. Setup Mobile App

```bash
cd apps/mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

Scan the QR code with Expo Go app to test on your device.

## 🔑 Environment Variables

### Backend (.env)
```env
GEMINI_API_KEY=your_gemini_api_key
REMOVEBG_API_KEY=your_removebg_api_key
MONGODB_CONNECTION_STRING=mongodb+srv://...
MONGODB_DATABASE_NAME=zahgo
JWT_SECRET=your_secure_secret_key
```

### Mobile (environment.ts)
The app auto-detects your development IP. For production builds, update:
```typescript
apiUrl: "https://your-production-api.com/api/v1"
```

## 📦 Building for Production

### Build Android APK

```bash
cd apps/mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build APK
eas build -p android --profile preview
```

Download the APK from the Expo dashboard.

### Deploy Backend

**Recommended: Railway.app**

1. Push code to GitHub
2. Create new project on Railway.app
3. Connect GitHub repository
4. Set environment variables in Railway dashboard
5. Deploy automatically

## 🧪 Testing

### Mobile App
```bash
cd apps/mobile
npm test
```

### Backend API
```bash
cd services/api
dotnet test
```

## 📱 App Features Walkthrough

1. **Registration/Login** - Create account with email/phone
2. **Home Screen** - Quick access to add products and AI studio
3. **Add Product Flow**:
   - Take product photo
   - Speak or type product details
   - AI extracts information
   - Review and publish
4. **AI Product Studio** - Professional background removal
5. **Products Management** - View, edit, publish, and deactivate products

## 🔒 Security Notes

- Never commit `.env` files to Git
- Keep API keys secure
- Use environment variables for sensitive data
- JWT tokens expire after 60 minutes
- MongoDB connection uses TLS encryption

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure IP is whitelisted in MongoDB Atlas
- Check connection string format
- Verify username/password encoding

### Build Errors
- Clear Metro bundler cache: `npx expo start -c`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be >= 20.19.4)

## 📄 License

Proprietary - All rights reserved

## 👥 Team

- **Developer**: Mathiyazhagan
- **Organization**: ZAH Seller AI

## 📞 Support

For issues and questions, please contact: mathimathiyazahgan@gmail.com

---

Made with ❤️ in India 🇮🇳
