const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('./src/config/passport')
// const xss = require('xss-clean'); // Commented due to known issues

const connectDB = require('./src/config/db'); // Assuming you moved it to a file
const { limiter } = require('./src/middlewares/security');
const authRoutes = require('./src/routes/authRoutes');
const competitionRoutes = require('./src/routes/competition.routes');
// Add more routes when needed
const participationRoutes = require('./src/routes/participationRoutes')
const cookieParser = require('cookie-parser'); // For parsing cookies
const app = express();
const session = require('express-session');

// Connect to MongoDB
connectDB().then(()=>{app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});});
require('./src/utils/competitionStatusJob');
app.use(
  session({
    secret: 'your_super_secret_key', // Change this in production
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true in production with HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Middleware setup
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(helmet());
app.use(morgan('tiny'));
app.use(passport.initialize());
app.use(passport.session());
app.use(limiter);
// app.use(xss()); // Commented if it causes issues
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // For parsing cookies 
// Routes
app.use('/api/participations',participationRoutes); // Assuming you have a participation route
app.use('/api/auth', authRoutes);
app.use('/api/competitions', competitionRoutes);
// Add other routes similarly

// Error handler middleware (optional)
// app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;



