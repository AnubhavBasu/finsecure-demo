// In-memory store for short-lived OTP challenges (login MFA + transfer step-up).
// Deliberately NOT persisted to the database — the brief calls for exactly one
// table, and these challenges are transient by nature (expire in 5 minutes).
//
// NOTE: in-memory means challenges are lost on server restart, and this will
// not scale past a single process. That's fine for a local demo; call it out
// if this ever needs to run behind more than one backend instance.

const DEMO_OTP = '123456'; // fixed, on purpose — see README "Demo conveniences"
const TTL_MS = 5 * 60 * 1000;

const challenges = new Map(); // challengeId -> { type, payload, expiresAt }

function createChallenge(type, payload) {
  const challengeId = `${type}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  challenges.set(challengeId, {
    type,
    payload,
    expiresAt: Date.now() + TTL_MS,
  });
  return challengeId;
}

function verifyChallenge(challengeId, otp) {
  const entry = challenges.get(challengeId);
  if (!entry) return { ok: false, reason: 'CHALLENGE_NOT_FOUND' };
  if (Date.now() > entry.expiresAt) {
    challenges.delete(challengeId);
    return { ok: false, reason: 'CHALLENGE_EXPIRED' };
  }
  if (otp !== DEMO_OTP) {
    return { ok: false, reason: 'INCORRECT_OTP' };
  }
  challenges.delete(challengeId);
  return { ok: true, type: entry.type, payload: entry.payload };
}

module.exports = { createChallenge, verifyChallenge, DEMO_OTP };
