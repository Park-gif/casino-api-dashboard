# StarGate Game Provider Dashboard

A modern, feature-rich dashboard for game providers built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🎮 Game Management
- Comprehensive game list management
- Game integration API endpoints
- Real-time game status monitoring
- Game launch URL generation
- Support for multiple game providers

### 👥 Player Management
- Player creation and management
- Player balance tracking
- Activity monitoring
- Transaction history
- Player authentication system

### 💰 Transaction System
- Real-time transaction tracking
- Support for multiple currencies
- Detailed transaction history
- Transaction type categorization (spin, bonus, jackpot)
- Balance management system

### 🔒 Security
- API key authentication
- Secure WebSocket connections
- HTTPS enforcement
- Rate limiting
- Input validation and sanitization

### 💼 Backoffice Features
- Merchant management
- API key management
- Callback URL configuration
- Activity logs
- System monitoring

### 🎁 Bonus System
- Bonus management
- Bonus history tracking
- Multiple bonus types support
- Bonus rules configuration

### 📊 Dashboard Features
- Modern UI with Tailwind CSS
- Responsive design
- Real-time updates
- Interactive charts and statistics
- Dark/Light mode support

### 🔧 Technical Features
- WebGL background effects
- Smooth animations
- Collapsible sidebar
- TypeScript support
- Component-based architecture

## Tech Stack

- **Frontend:**
  - Next.js 14
  - TypeScript
  - Tailwind CSS
  - Framer Motion
  - Lucide Icons
  - WebGL/GLSL

- **Backend:**
  - Node.js
  - Express
  - MongoDB
  - GraphQL (Apollo)
  - WebSocket

## Project Structure

```
├── app/
│   ├── components/         # Shared components
│   ├── dashboard/         # Dashboard pages
│   ├── auth/             # Authentication pages
│   └── page.tsx          # Landing page
├── backend/
│   ├── src/
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── schema/       # GraphQL schema
├── components/           # UI components
│   ├── ui/              # Base UI components
│   └── sidebar.tsx      # Main sidebar component
└── lib/                 # Utility functions
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/stargate-dashboard.git
```

2. Install dependencies:
```bash
# Frontend
cd stargate-dashboard
npm install

# Backend
cd backend
npm install
```

3. Set up environment variables:
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:2053
NEXT_PUBLIC_WS_URL=ws://localhost:2053

# Backend (.env)
PORT=2053
MONGODB_URI=mongodb://localhost:27017/stargate
JWT_SECRET=your_jwt_secret
```

4. Run the development servers:
```bash
# Frontend
npm run dev

# Backend
npm run dev
```

## API Documentation

The API documentation is available at `/docs` when running the development server. It includes:
- Authentication endpoints
- Game management API
- Player management API
- Transaction API
- WebSocket events

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@stargate.com or join our Slack channel.
