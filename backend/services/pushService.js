const { initializeApp, getApps, cert, applicationDefault } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const Device = require('../models/PushDevice');
const Event = require('../models/PushEvent');

const enabled = () => process.env.PUSH_ENABLED === 'true';
function messaging() {
  if (!getApps().length) {
    initializeApp({
      credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
        ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
        : applicationDefault(),
    });
  }
  return getMessaging();
}

async function enqueue({ key, user, title, body, data }) {
  if (!enabled()) return;
  try {
    await Event.updateOne({ key }, { $setOnInsert: { key, user, title, body, data } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
}

let running = false;
async function drain() {
  if (!enabled() || running) return;
  running = true;
  try {
    for (let count = 0; count < 20; count++) {
      const event = await Event.findOneAndUpdate(
        { sent: false, nextAttempt: { $lte: new Date() } },
        { $set: { nextAttempt: new Date(Date.now() + 5 * 60 * 1000) } }, { new: true });
      if (!event) break;
      try {
        const devices = await Device.find({ user: event.user });
        if (!devices.length) {
          await Event.updateOne({ _id: event._id }, { $set: { sent: true } });
          continue;
        }
        let retry = false;
        for (let i = 0; i < devices.length; i += 500) {
          const batch = devices.slice(i, i + 500);
          const result = await messaging().sendEachForMulticast({
            tokens: batch.map(device => device.token),
            notification: { title: event.title, body: event.body },
            data: { ...Object.fromEntries(event.data || []), eventId: event.key },
            android: { priority: 'high', notification: { tag: event.key, icon: 'ic_notification' } },
          });
          for (let j = 0; j < result.responses.length; j++) {
            const response = result.responses[j];
            if (response.success) continue;
            if (['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(response.error?.code)) {
              await Device.deleteOne({ _id: batch[j]._id });
            } else retry = true;
          }
        }
        if (!retry) await Event.updateOne({ _id: event._id }, { $set: { sent: true } });
      } catch (error) { console.error('Push delivery will retry:', error.code || error.name); }
    }
  } finally { running = false; }
}

function startWorker() {
  if (!enabled()) return;
  const tick = () => drain().catch(error => console.error('Push queue error:', error.code || error.name));
  tick();
  setInterval(tick, 30000).unref();
}
module.exports = { enqueue, startWorker, drain };
