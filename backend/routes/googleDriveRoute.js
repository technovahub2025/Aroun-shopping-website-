const express = require('express');
const crypto = require('node:crypto');

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Check whether the required Drive configuration exists
|--------------------------------------------------------------------------
*/
function isConfigured() {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
    process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN &&
    process.env.GOOGLE_DRIVE_FOLDER_ID
  );
}

/*
|--------------------------------------------------------------------------
| Get an access token using the existing refresh token
|--------------------------------------------------------------------------
*/
async function getAccessToken() {
  if (
    !process.env.GOOGLE_DRIVE_CLIENT_ID ||
    !process.env.GOOGLE_DRIVE_CLIENT_SECRET ||
    !process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  ) {
    throw new Error('Google Drive credentials are not configured.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
      client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(10000),
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
      data.error ||
      'Unable to authorize Google Drive.'
    );
  }

  return data.access_token;
}

/*
|--------------------------------------------------------------------------
| GET /status
|--------------------------------------------------------------------------
*/
router.get('/status', async (req, res) => {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

  if (!isConfigured()) {
    return res.json({
      success: true,
      configured: false,
      connected: false,
      email: null,
      folderAccessible: false,
      folderId,
    });
  }

  try {
    const accessToken = await getAccessToken();

    /*
     * Get the Google account information.
     */
    const aboutResponse = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!aboutResponse.ok) {
      throw new Error('Unable to access the Drive account.');
    }

    const aboutData = await aboutResponse.json();

    const email =
      aboutData?.user?.emailAddress ||
      null;

    /*
     * Check whether the configured folder is accessible.
     */
    let folderAccessible = false;

    if (folderId) {
      const folderResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          folderId
        )}?fields=id,name,mimeType&supportsAllDrives=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      folderAccessible = folderResponse.ok;
    }

    return res.json({
      success: true,
      configured: true,
      connected: true,
      email,
      folderAccessible,
      folderId,
    });
  } catch (error) {
    console.error('Drive status error:', error.message);

    return res.json({
      success: true,
      configured: true,
      connected: false,
      email: null,
      folderAccessible: false,
      folderId,
      message: error.message,
    });
  }
});


/*
|--------------------------------------------------------------------------
| GET /auth
|--------------------------------------------------------------------------
| Start Google OAuth authorization.
|--------------------------------------------------------------------------
*/
router.get('/auth', (req, res) => {
  try {
    const {
      GOOGLE_DRIVE_CLIENT_ID,
      GOOGLE_DRIVE_REDIRECT_URI,
    } = process.env;

    if (!GOOGLE_DRIVE_CLIENT_ID || !GOOGLE_DRIVE_REDIRECT_URI) {
      return res.status(500).json({
        success: false,
        message: 'Google Drive OAuth configuration is incomplete.',
      });
    }

    const state = crypto.randomBytes(32).toString('hex');

    const params = new URLSearchParams({
      client_id: GOOGLE_DRIVE_CLIENT_ID,
      redirect_uri: GOOGLE_DRIVE_REDIRECT_URI,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: 'https://www.googleapis.com/auth/drive',
      state,
    });

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return res.redirect(authUrl);
  } catch (error) {
    console.error('Drive auth error:', error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


/*
|--------------------------------------------------------------------------
| GET /callback
|--------------------------------------------------------------------------
*/
router.get('/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.status(400).send(`
        <html>
          <body>
            <h2>Authorization cancelled</h2>
            <p>${error}</p>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send(`
        <html>
          <body>
            <h2>Authorization failed</h2>
            <p>No authorization code was received.</p>
          </body>
        </html>
      `);
    }

    const {
      GOOGLE_DRIVE_CLIENT_ID,
      GOOGLE_DRIVE_CLIENT_SECRET,
      GOOGLE_DRIVE_REDIRECT_URI,
    } = process.env;

    if (
      !GOOGLE_DRIVE_CLIENT_ID ||
      !GOOGLE_DRIVE_CLIENT_SECRET ||
      !GOOGLE_DRIVE_REDIRECT_URI
    ) {
      throw new Error(
        'Google Drive OAuth environment variables are incomplete.'
      );
    }

    /*
     * Exchange authorization code for tokens.
     */
    const tokenResponse = await fetch(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_DRIVE_CLIENT_ID,
          client_secret: GOOGLE_DRIVE_CLIENT_SECRET,
          redirect_uri: GOOGLE_DRIVE_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.refresh_token) {
      throw new Error(
        tokenData.error_description ||
        tokenData.error ||
        'Google did not return a refresh token.'
      );
    }

    /*
     * IMPORTANT:
     *
     * Your existing upload utility reads
     * GOOGLE_DRIVE_REFRESH_TOKEN from process.env.
     *
     * The callback cannot permanently modify the .env file
     * on the server. Therefore the refresh token needs to be
     * saved using your existing deployment/environment setup.
     *
     * For the current local test, expose the token through
     * the process environment.
     */
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN =
      tokenData.refresh_token;

    /*
     * Verify the newly authorized account.
     */
    const accessToken = await getAccessToken();

    const aboutResponse = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    const aboutData = await aboutResponse.json();

    /*
     * Verify the configured folder.
     */
    let folderAccessible = false;

    if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
      const folderResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          process.env.GOOGLE_DRIVE_FOLDER_ID
        )}?fields=id,name,mimeType&supportsAllDrives=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      folderAccessible = folderResponse.ok;
    }

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      return res.status(500).send(`
        <html>
          <body>
            <h2>Authorization successful</h2>
            <p>FRONTEND_URL is not configured.</p>
          </body>
        </html>
      `);
    }

    const redirectUrl = new URL(frontendUrl);

    redirectUrl.searchParams.set('drive', 'connected');

    if (!folderAccessible) {
      redirectUrl.searchParams.set('folder', 'unavailable');
    }

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Drive callback error:', error);

    return res.status(500).send(`
      <html>
        <body>
          <h2>Authorization failed</h2>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
});


/*
|--------------------------------------------------------------------------
| GET /test
|--------------------------------------------------------------------------
*/
router.get('/test', async (req, res) => {
  try {
    const accessToken = await getAccessToken();

    const aboutResponse = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!aboutResponse.ok) {
      throw new Error('Drive account could not be accessed.');
    }

    const aboutData = await aboutResponse.json();

    let folderAccessible = false;

    if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
      const folderResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          process.env.GOOGLE_DRIVE_FOLDER_ID
        )}?fields=id,name,mimeType&supportsAllDrives=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      folderAccessible = folderResponse.ok;
    }

    return res.json({
      success: true,
      connected: true,
      email:
        aboutData?.user?.emailAddress ||
        null,
      folderAccessible,
      folderId:
        process.env.GOOGLE_DRIVE_FOLDER_ID ||
        null,
    });
  } catch (error) {
    console.error('Drive test error:', error.message);

    return res.status(500).json({
      success: false,
      connected: false,
      message: error.message,
    });
  }
});


module.exports = router;