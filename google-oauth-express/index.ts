import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Google OAuth client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Google OAuth Express</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .btn { background: #4285f4; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
            .btn:hover { background: #3367d6; }
            .status { margin: 20px 0; padding: 10px; border-radius: 4px; }
            .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        </style>
    </head>
    <body>
        <h1>Google OAuth Express Demo</h1>
        <p>Click the button below to sign in with Google:</p>
        <a href="/auth/google" class="btn">Sign in with Google</a>
        <div id="status"></div>
        
        <script>
            // Check for authentication status
            fetch('/auth/status')
                .then(response => response.json())
                .then(data => {
                    const statusDiv = document.getElementById('status');
                    if (data.authenticated) {
                        statusDiv.innerHTML = '<div class="status success">Welcome, ' + data.user.name + '!</div>';
                    } else {
                        statusDiv.innerHTML = '<div class="status">Not authenticated</div>';
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        </script>
    </body>
    </html>
  `);
});

// Google OAuth routes
app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
  });
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code not provided');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const user = {
      id: payload?.sub,
      name: payload?.name,
      email: payload?.email,
      picture: payload?.picture,
    };

    // In a real app, you'd save this to a database and create a session
    // For demo purposes, we'll just redirect with user info
    res.redirect(`/?user=${encodeURIComponent(JSON.stringify(user))}`);
  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).send('Authentication failed');
  }
});

// Check authentication status
app.get('/auth/status', (req, res) => {
  // In a real app, you'd check session/database
  // For demo, we'll return not authenticated
  res.json({ authenticated: false });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Google OAuth configured with Client ID: ${process.env.GOOGLE_CLIENT_ID?.substring(0, 20)}...`);
  console.log(`🔗 Redirect URI: ${process.env.GOOGLE_REDIRECT_URI}`);
});