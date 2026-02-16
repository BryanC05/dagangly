# MSME Marketplace

A full-stack web application connecting Micro, Small, and Medium Enterprises (MSMEs) with local buyers. Sellers can list their products, and buyers can discover and purchase items from nearby businesses.

## Features

### For Buyers
- Browse products by category
- Search products by name, description, or tags
- Filter by price range and category
- Find nearby sellers using interactive map
- View seller ratings and reviews
- Add products to cart
- Save products for later
- Place orders from local sellers
- Track order status
- Browse seller stores
- Community forums for discussions
- Real-time chat with sellers
- Multi-language support (English/Hindi)
- Dark/light theme support

### For Sellers (MSMEs)
- Register as Micro, Small, or Medium Enterprise
- Add and manage products with images
- Set stock quantities and pricing
- Receive and manage orders
- Update order status (Pending → Confirmed → Preparing → Ready → Delivered)
- View sales dashboard with statistics
- Manage business profile
- Participate in community forums
- Real-time messaging with buyers

### Technical Features
- Geolocation-based search for nearby sellers
- Interactive map using Leaflet
- Real-time distance calculations
- JWT-based authentication
- Responsive design for mobile and desktop
- Image upload support
- Category-based product filtering
- Real-time chat with Socket.io
- Community forum system
- Multi-language i18n support
- Theme management (dark/light mode)
- Persistent cart and saved items

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Socket.io for real-time chat
- Geospatial queries with MongoDB 2dsphere indexes
- Multer for file uploads

### Frontend
- React with Vite
- React Router for navigation
- TanStack Query (React Query) for data fetching
- Zustand for state management
- Socket.io-client for real-time chat
- Leaflet with React-Leaflet for maps
- shadcn/ui component library
- Lucide React for icons
- CSS3 with Tailwind CSS
- i18n for multi-language support

## Project Structure

```
msme-marketplace/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── ChatRoom.js
│   │   ├── Message.js
│   │   ├── ForumThread.js
│   │   └── ForumReply.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── users.js
│   │   ├── orders.js
│   │   ├── chat.js
│   │   └── forum.js
│   ├── middleware/
│   │   └── auth.js
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ProductCard.jsx
    │   │   ├── LocationPicker.jsx
    │   │   ├── ScrollToTop.jsx
    │   │   ├── forums/
    │   │   │   └── ForumPostCard.jsx
    │   │   ├── layout/
    │   │   │   ├── Layout.jsx
    │   │   │   ├── Navbar.jsx
    │   │   │   └── Footer.jsx
    │   │   ├── products/
    │   │   │   └── ProductCard.jsx
    │   │   └── ui/
    │   │       └── (shadcn/ui components)
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Products.jsx
    │   │   ├── ProductDetail.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── SellerDashboard.jsx
    │   │   ├── SellerStore.jsx
    │   │   ├── Sell.jsx
    │   │   ├── AddProduct.jsx
    │   │   ├── Orders.jsx
    │   │   ├── Profile.jsx
    │   │   ├── NearbyMap.jsx
    │   │   ├── Cart.jsx
    │   │   ├── SavedProducts.jsx
    │   │   ├── Chat.jsx
    │   │   ├── Messages.jsx
    │   │   ├── Forums.jsx
    │   │   ├── Forum.jsx
    │   │   ├── ThreadDetail.jsx
    │   │   ├── NewThread.jsx
    │   │   └── EditThread.jsx
    │   ├── store/
    │   │   ├── authStore.js
    │   │   ├── languageStore.js
    │   │   ├── savedProductsStore.js
    │   │   └── themeStore.js
    │   ├── hooks/
    │   │   ├── use-mobile.js
    │   │   └── useTranslation.js
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── App.css
    │   └── main.jsx
    ├── package.json
    └── index.html
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd msme-marketplace/backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env` file and update values:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/msme_marketplace
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

4. Start the backend server:
```bash
# Development mode with auto-reload
npm run dev

# OR Production mode
npm start
```

The backend will run on http://localhost:5000

### Stopping the Backend

To stop the backend server, use one of these methods:

**Method 1: Using Keyboard (Recommended)**
```bash
# In the terminal where the backend is running, press:
Ctrl + C
```

**Method 2: Find and Kill Process (Linux/Mac)**
```bash
# Find the Node.js process running on port 5000
lsof -i :5000

# Kill the process (replace <PID> with the actual process ID)
kill -9 <PID>

# Or kill all Node processes (use with caution)
pkill -f "node server.js"
```

**Method 3: Using Command Line (Windows)**
```cmd
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace <PID> with the actual process ID)
taskkill /PID <PID> /F
```

**Method 4: Kill Script**
Save this as `kill-backend.sh`:
```bash
#!/bin/bash
PID=$(lsof -t -i:5000)
if [ -n "$PID" ]; then
  kill -9 $PID
  echo "Backend stopped (PID: $PID)"
else
  echo "No backend running on port 5000"
fi
```

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

4. Build for production:
```bash
npm run build
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (buyer or seller)
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - Get all products (with filters, pagination, geolocation)
- `GET /api/products/:id` - Get single product
- `GET /api/products/seller/:sellerId` - Get products by seller
- `POST /api/products` - Create product (seller only)
- `PUT /api/products/:id` - Update product (seller only)
- `DELETE /api/products/:id` - Delete product (seller only)

### Users
- `GET /api/users/nearby-sellers` - Get nearby sellers by geolocation
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Orders
- `GET /api/orders/my-orders` - Get user's orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status

### Chat
- `GET /api/chat` - Get user's chat rooms
- `GET /api/chat/:userId` - Get or create chat room with user
- `GET /api/chat/:roomId/messages` - Get messages in a chat room
- `POST /api/chat/:roomId/messages` - Send message in chat room

### Forum
- `GET /api/forum` - Get all forum threads
- `GET /api/forum/:id` - Get single thread with replies
- `POST /api/forum` - Create new thread
- `PUT /api/forum/:id` - Update thread
- `DELETE /api/forum/:id` - Delete thread
- `POST /api/forum/:id/replies` - Add reply to thread
- `PUT /api/forum/replies/:replyId` - Update reply
- `DELETE /api/forum/replies/:replyId` - Delete reply

## Key Features Explained

### Geolocation Search
The app uses MongoDB's geospatial queries to find sellers within a specified radius. When a user allows location access, the app:
1. Gets user's coordinates
2. Queries the database for sellers within the selected radius
3. Displays results on an interactive map
4. Calculates distances between user and sellers

### Role-Based Access
- **Buyers**: Can browse products, add to cart, place orders
- **Sellers**: Can manage products, view dashboard, process orders
- Authentication middleware ensures proper access control

### Order Management
Orders flow through statuses:
1. **Pending** - Order placed, awaiting confirmation
2. **Confirmed** - Seller confirmed the order
3. **Preparing** - Seller preparing the items
4. **Ready** - Order ready for pickup/delivery
5. **Delivered** - Order completed
6. **Cancelled** - Order cancelled

### Cart System
- Add products to cart while browsing
- Adjust quantities or remove items
- View total price calculation
- Proceed to checkout from cart
- Cart persists across sessions

### Saved Products
- Save products to a wishlist for later
- Quick access to saved items from profile
- Remove items from saved list

### Real-Time Chat
- Direct messaging between buyers and sellers
- Persistent chat rooms per conversation
- Real-time message updates via Socket.io
- View chat history

### Community Forums
- Create discussion threads on various topics
- Reply to threads and engage with community
- Browse forums by category
- Edit and delete own posts
- View thread activity and replies

### Multi-Language Support
- Toggle between English and Hindi
- Translations for all major UI elements
- Persistent language preference

### Theme Support
- Toggle between light and dark modes
- System preference detection
- Theme persists across sessions

## Development Notes

### Adding New Features
1. Backend: Add routes in appropriate route file
2. Backend: Update models if needed
3. Frontend: Create/update pages in `/src/pages/`
4. Frontend: Add routes in `App.jsx`
5. Frontend: Add navigation links in `Navbar.jsx`

### Styling
- Global styles in `App.css`
- Component-specific styles in `.css` files next to components
- CSS variables for consistent theming
- Responsive design with mobile-first approach

### State Management
- Zustand for auth and cart state
- React Query for server state
- Local state with React useState for form inputs

## Future Enhancements

- [x] Payment gateway integration (Razorpay/Stripe)
- [x] Real-time chat between buyers and sellers
- [x] Community forum system
- [x] Multi-language support (English/Hindi)
- [x] Dark/light theme support
- [ ] Review and rating system
- [ ] Push notifications for order updates
- [ ] Mobile app (React Native)
- [ ] Advanced analytics for sellers
- [ ] Delivery tracking system
- [ ] SMS notifications
- [ ] Email notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions, please open an issue on the repository or contact the development team.

---

Built with ❤️ for MSMEs everywhere!