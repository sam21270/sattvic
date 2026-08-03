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

// The single most common mistake: pasting Atlas's string as-is.
if (/<[^>]*(password|db_password|username)[^>]*>/i.test(uri)) {
  console.error(
    // ponytail: shows only the credentials segment, not a whole srv URI.
    // A full example URI here matches GitHub's Atlas-credential scanner and
    // opens a "possible valid secret" alert on every push.
    "The connection string still contains a placeholder like <db_password>.\n" +
    "Replace it — angle brackets and all — with the real password, so the\n" +
    "credentials segment reads  user:s3cret  and not  user:<db_password>.",
  );
  process.exit(1);
}

// A raw @ : / ? # in a password breaks URL parsing and shows up as bad auth.
const creds = uri.slice(uri.indexOf("//") + 2, uri.lastIndexOf("@"));
if (creds.includes("@") || /[/?#]/.test(creds)) {
  console.error(
    "The username or password contains a character that must be percent-encoded\n" +
    "(@ becomes %40, : becomes %3A, / becomes %2F, ? becomes %3F, # becomes %23).\n" +
    "Easiest fix: set a password with only letters and numbers in Atlas → Database Access.",
  );
  process.exit(1);
}

const client = new MongoClient(uri);
try {
  await client.connect();

  // A connection string without a database name silently falls back to "test",
  // which would report "nothing to clean" while the real data sits elsewhere.
  // So: default to "sattvic", say which database we are in, and prove the
  // users are in it. MONGODB_DB overrides.
  const db = client.db(process.env.MONGODB_DB || "sattvic");
  const users = db.collection("users");
  const total = await users.countDocuments();
  console.log(`database: ${db.databaseName}`);
  console.log(`users found: ${total}`);

  if (total === 0) {
    console.log("\nNo users in this database — the name is probably wrong.");
    const { databases } = await client.db().admin().listDatabases();
    for (const d of databases) {
      if (["admin", "local", "config"].includes(d.name)) continue;
      const names = await client.db(d.name).listCollections().toArray();
      const n = names.some((c) => c.name === "users")
        ? await client.db(d.name).collection("users").countDocuments()
        : null;
      console.log(`  ${d.name}: ${n === null ? "no users collection" : n + " users"}`);
    }
    console.log("\nRe-run with the right one, e.g.:");
    console.log('  MONGODB_DB="sattvic" MONGODB_URI="..." node scripts/purge-stored-pii.mjs');
    process.exit(1);
  }

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
} catch (err) {
  // Turn Mongo's stack dump into the two things that are actually wrong.
  const msg = String(err?.message ?? err);
  if (/bad auth|authentication failed/i.test(msg)) {
    console.error(
      "\nAuthentication failed — the username or password is wrong.\n" +
      "  · Did you replace <db_password> with the real password?\n" +
      "  · Atlas → Database Access → Edit → Edit Password to set a new one\n" +
      "    (use letters and numbers only to avoid encoding issues).\n" +
      "  · If you change it, update MONGODB_URI in Vercel too, or the live site breaks.",
    );
  } else if (/ETIMEDOUT|ENOTFOUND|ServerSelection|queryTxt/i.test(msg)) {
    console.error(
      "\nCould not reach the cluster.\n" +
      "  · Atlas → Network Access → Add IP Address → Add Current IP Address\n" +
      "  · Check the cluster hostname is correct and the cluster is not paused.",
    );
  } else {
    console.error("\n" + msg);
  }
  process.exitCode = 1;
} finally {
  await client.close();
}
