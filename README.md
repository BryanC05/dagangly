# Dagangly - Indonesian MSME Marketplace

A full-stack web application connecting Micro, Small, and Medium Enterprises (MSMEs) with local buyers. Sellers can list their products, and buyers can discover and purchase items from nearby businesses.

## Table of Contents
1. [Brand](#brand)
2. [Features](#features)
   - [For Buyers](#for-buyers)
   - [For Sellers (MSMEs)](#for-sellers-msmes)
   - [Technical Features](#technical-features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Setup Instructions](#setup-instructions)
   - [Backend Setup (Go)](#backend-setup-go)
   - [Frontend Setup](#frontend-setup)
   - [Mobile Setup](#mobile-setup)
6. [Contributing](#contributing)
7. [License](#license)

## Brand

- **Name**: Dagangly
- **Tagline**: Indonesian MSME Marketplace - Connecting local sellers with nearby buyers

## Features

### For Buyers
- Browse products by category
- Search products by name, description, or tags
- Filter by price range and category
- Find nearby sellers using interactive map
- **Map-based Live Tracking** - Real-time tracking of order deliveries
- **Barcode/QR Scanner** - Quickly find products by scanning
- View seller ratings and reviews
- Add products to cart
- **Cart Abandonment Recovery** - Automatic reminders for left items
- Save products for later
- Place orders from local sellers
- Track order status
- Browse seller stores
- Community forums for discussions
- Real-time chat with sellers
- Multi-language support (English/Indonesian)
- Dark/light theme support
- **Hero Slideshow** - Auto-advancing featured images on home page
- **User Guide & Tutorials** - In-app help center with step-by-step tutorials for buyers and sellers

### For Sellers (MSMEs)
- Register as Micro, Small, or Medium Enterprise
- **Business Registration** - Submit business application for admin approval
- Add and manage products with images
- Set stock quantities and pricing
- **Dynamic UI Components** - Live stock badges and order status countdowns
- Receive and manage orders
- Update order status (Pending → Confirmed → Preparing → Ready → Delivered)
- View sales dashboard with statistics
- Manage business profile
- Participate in community forums
- Real-time messaging with buyers
- AI-powered logo generation (Premium)
- n8n workflow automation (Premium)
- **Instagram Auto-Post** - Automatically post products to Instagram when listed

### Technical Features
- Geolocation-based search for nearby sellers
- Interactive map using Leaflet
- Real-time distance calculations
- JWT-based authentication
- Responsive design for mobile and desktop
- Image upload support
- Product photo enhancement via Claid (manual per image)
- Category-based product filtering
- Real-time chat with WebSocket
- Community forum system
- Multi-language i18n support
- Theme management (dark/light mode)
- Persistent cart and saved items
- Premium membership system (Rp 10.000/month)
- n8n webhook integrations for workflow automation
- **Instagram Auto-Post** - Automatic product posting to Instagram Business accounts via Meta Graph API

## Tech Stack

### Backend (Go)
- Go with Gin framework
- MongoDB with official Go driver
- JWT for authentication
- bcrypt for password hashing
- Gorilla WebSocket for real-time chat
- Geospatial queries with MongoDB 2dsphere indexes

### Frontend
- React with Vite
- React Router for navigation
- TanStack Query (React Query) for data fetching
- Zustand for state management
- Native WebSocket for real-time chat
- Leaflet with React-Leaflet for maps
- shadcn/ui component library
- Lucide React for icons
- Tailwind CSS
- i18next for multi-language support

## Project Structure

```
msme-marketplace/
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   ├── internal/
│   │   ├── config/
│   │   │   └── config.go
│   │   ├── database/
│   │   │   └── mongo.go
│   │   ├── handlers/
│   │   │   ├── auth.go
│   │   │   ├── users.go
│   │   │   ├── products.go
│   │   │   ├── orders.go
│   │   │   ├── chat.go
│   │   │   ├── forum.go
│   │   │   ├── workflows.go
│   │   │   ├── logo.go
│   │   │   └── webhooks.go
│   │   ├── middleware/
│   │   │   └── auth.go
│   │   ├── models/
│   │   │   ├── user.go
│   │   │   ├── product.go
│   │   │   ├── order.go
│   │   │   ├── chatroom.go
│   │   │   ├── forum.go
│   │   │   └── workflow.go
│   │   └── websocket/
│   │       └── hub.go
│   ├── uploads/
│   ├── Dockerfile
│   ├── go.mod
│   ├── go.sum
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── config/
│   │   ├── data/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env
└── mobile/
    └── (React Native/Expo mobile app)
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Go (v1.21 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)
- Git

> **Note:** This repository does not include `node_modules` directories. After cloning, you must run `npm install` in each project directory (backend, frontend, mobile) to install dependencies.

### Backend Setup (Go)

1. Navigate to the backend directory:
```bash
cd msme-marketplace/backend
```

2. Install dependencies:
```bash
go mod download
```

3. Configure environment variables:
   - Copy `.env` file and update values:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/msme_marketplace
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
HUGGINGFACE_API_KEY=your-huggingface-api-key
DEEPAI_API_KEY=your-deepai-api-key
POLLINATIONS_API_KEY=your-pollinations-api-key
CLAID_API_KEY=your-claid-api-key
CLAID_BASE_URL=https://api.claid.ai/v1
CLAID_TIMEOUT_SECONDS=45
PRODUCT_IMAGE_MAX_SIZE_MB=5
PRODUCT_IMAGE_MAX_COUNT=4
PRODUCT_ENHANCE_DAILY_LIMIT=20
```

4. Run the backend:
```bash
# Build and run
go build -o server ./cmd/server
./server

# Or run directly
go run ./cmd/server
```

The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd msme-marketplace/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:5173

### Mobile Setup

1. Navigate to the mobile directory:
```bash
cd msme-marketplace/mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npx expo start
```

Scan the QR code with the Expo Go app to run the app on your device.

## Contributing

We welcome contributions! To get started:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes with clear messages.
4. Push your branch and create a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
