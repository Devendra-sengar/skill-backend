// // 1. Install required packages:
// // npm install passport passport-google-oauth20

// // config/passport.js
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const User = require('../models/User');
// const config = require('../config/auth');

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: '/api/auth/google/callback',
//       scope: ['profile', 'email']
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         // Check if user already exists
//         let user = await User.findOne({ email: profile.emails[0].value });

//         if (user) {
//           // User exists, update Google information
//           user.lastLogin = Date.now();
//           await user.save({ validateBeforeSave: false });
//           return done(null, user);
//         } else {
//           // Create new user with Google info
//           const newUser = await User.create({
//             firstName: profile.name.givenName || profile.displayName.split(' ')[0],
//             email: profile.emails[0].value,
//             // Generate a random secure password since login will be via Google
//             password: require('crypto').randomBytes(16).toString('hex'),
//             emailVerified: true, // Google already verified the email
//             profilePicture: profile.photos[0].value || 'default-profile.jpg',
//             googleId: profile.id
//           });

//           return done(null, newUser);
//         }
//       } catch (error) {
//         return done(error, null);
//       }
//     }
//   )
// );

// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await User.findById(id);
//     done(null, user);
//   } catch (error) {
//     done(error, null);
//   }
// });

// module.exports = passport;

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
// const config = require('../config/config'); // Adjust this path based on your project structure

// Passport configuration
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: "1013952463284-0rfsvs0imcp175p82pq95iu8es8um2j0.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: `https://skill-backend-dats.onrender.com/api/auth/google/callback`,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, return the user
          return done(null, user);
        }

        // Check if user exists with email
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        user = await User.findOne({ email });
         console.log("passport user",user)
        if (user) {
          // Link Google ID to existing user
          user.googleId = profile.id;
          user.emailVerified = true; // Google verifies email
          await user.save({ validateBeforeSave: false });
          return done(null, user);
        }

        // Create new user if not found
        const newUser = await User.create({
          username: profile.displayName || profile.name?.givenName || 'Google User',
          email: email,
          googleId: profile.id,
          emailVerified: true,
          profilePicture: profile.photos?.[0]?.value || 'default-profile.jpg',
          country: "Not specified", // Required fields based on your schema
          state: "Not specified",
          city: "Not specified"
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;