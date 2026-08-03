/**
 * One-off cleanup: strips the copies of other people's email and real name that
 * older friend requests wrote into recipients' documents.
 *
 * The code no longer writes those fields, but rows created before that change
 * still carry them. Data sitting in the database is data that can still leak.
 *
 * Run with your real connection string:
 *   MONGODB_URI="mongodb+srv://..." node scripts/purge-stored-pii.mjs
 *
 * It reports what it would change, then makes the change. Safe to run twice.
 */
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Set MONGODB_URI first. Copy it from Vercel → Settings → Environment Variables.");
  process.exit(1);
}
if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
  console.error("That does not look like a MongoDB connection string.");
  process.exit(1);
}

const client = new MongoClient(uri);
try {
  await client.connect();
  const users = client.db().collection("users");

  const affected = await users.countDocuments({
    $or: [
      { "friendRequests.fromEmail": { $exists: true } },
      { "friendRequests.fromName": { $exists: true } },
    ],
  });
  console.log(`users holding someone else's email or name: ${affected}`);

  if (affected === 0) {
    console.log("nothing to clean.");
  } else {
    const res = await users.updateMany(
      {},
      { $unset: { "friendRequests.$[].fromEmail": "", "friendRequests.$[].fromName": "" } },
    );
    console.log(`cleaned ${res.modifiedCount} user document(s).`);
  }

  const left = await users.countDocuments({
    $or: [
      { "friendRequests.fromEmail": { $exists: true } },
      { "friendRequests.fromName": { $exists: true } },
    ],
  });
  console.log(left === 0 ? "verified: no stored copies remain." : `WARNING: ${left} still remain.`);
} finally {
  await client.close();
}
