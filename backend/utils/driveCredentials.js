const Connection = require('../models/driveConnectionModel');

async function getRefreshToken() {
  const connection = await Connection.findById(process.env.GOOGLE_DRIVE_CLIENT_ID)
    .select('+refreshToken').lean();
  return connection?.refreshToken || process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
}

async function saveRefreshToken(refreshToken) {
  // Persist before reporting success; process.env is lost on every restart.
  await Connection.findOneAndUpdate(
    { _id: process.env.GOOGLE_DRIVE_CLIENT_ID },
    { $set: { refreshToken } },
    { upsert: true, runValidators: true }
  );
}

module.exports = { getRefreshToken, saveRefreshToken };
