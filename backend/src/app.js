const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schema/types');
const resolvers = require('./schema/resolvers');
const { protect } = require('./middleware/auth');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

// GraphQL Server Setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    return {
      user: req.user,
      apiKey: req.apiKey
    };
  }
});

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });
}

startServer();

module.exports = app; 