// Load environment variables (ESM way)
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

// Import packages
import express from 'express';
import cors from 'cors';

// Import custom modules
import connectDB from './config/db.js';
import authRouter from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import recommendRoutes from './routes/recommend.js';
import aiRoutes from './routes/ai.js';
import notificationRoutes from "./routes/notificationRoutes.js";
import dayPlannerRoutes from './routes/dayPlanner.js';
import weatherRoutes from './routes/weather.routes.js';



// Initialize express
const app = express();

// Middlewares
app.use(express.json({ limit: '16kb' }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.use('/auth', authRouter);
app.use('/api/trips', tripRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/ai', aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use('/api/dayplanner', dayPlannerRoutes);
app.use('/api/weather', weatherRoutes); 


// Test route
app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.use("/api/notifications", notificationRoutes);



// Server + DB
const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to DB error', err);
    process.exit(1);
  });

export default app;
