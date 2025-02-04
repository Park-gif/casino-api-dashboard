require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schema/types');
const resolvers = require('./schema/resolvers');
const { startDailyUpdates } = require('./services/gameService');
const { authMiddleware } = require('./utils/auth');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const webhookRoutes = require('./routes/webhooks');
const { depositWatcher } = require('./services/depositWatcher');
const { merchantDepositWatcher } = require('./services/merchantDepositWatcher');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/webhooks', webhookRoutes);

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = await authMiddleware(req);
    return auth;
  }
});

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Start the game update service
    startDailyUpdates();
    console.log('Game update service started');

    // Start Apollo Server
    await server.start();
    
    // Apply Apollo middleware
    server.applyMiddleware({ 
      app,
      cors: false // Let Express CORS handle it
    });

    // Start Deposit Watchers
    await depositWatcher.start();
    await merchantDepositWatcher.start();

    // Start Express Server
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`GraphQL server ready at http://localhost:${port}${server.graphqlPath}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch(console.error); 