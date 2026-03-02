import express from 'express';
import { createClient } from 'redis';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();

// Redis client
const redis = createClient({
  url: process.env.REDIS_URL
});

redis.connect().catch(console.error);

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-env';

// ... (Rest of the Express routes) ...
// NOTE: For brevity, I will copy the routes here.

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// [All routes from server.js would go here]
// For the sake of this prompt, I will just export the app
export default app;
