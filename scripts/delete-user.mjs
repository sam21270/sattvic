/**
 * Deletes one person's data completely.
 *
 * You are storing real people's information now. If a tester asks to be removed
 * — or you just want the data gone after testing — this removes their account,
 * their synced logs, and every reference to them in anyone else's friend list
 * or pending requests. Leaving orphaned references behind is how "deleted"
 * accounts keep showing up in other people's UI.
 *
 *   MONGODB_URI="mongodb+srv://..." node scripts/delete-user.mjs someone@gmail.com
 *   MONGODB_URI="mongodb+srv://..." node scripts/delete-user.mjs someone@gmail.com --yes
 *
 * Without --yes it only reports what it would delete.
 */
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const target = process.argv[2];
const confirmed = process.argv.includes("--yes");

if (!uri) { console.error("Set MONGODB_URI first."); process.exit(1); }
if (/<[^>]*(password|username)[^>]*>/i.test(uri)) {
  console.error("The connection string still contains a placeholder like <db_password>.");
  process.exit(1);
}
if (!target || target.startsWith("--")) {
  console.error("Pass the email or username to delete:\n  node scripts/delete-user.mjs someone@gmail.com");
  process.exit(1);
}

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
  const users = db.collection("users");

  const user = await users.findOne(
    target.includes("@") ? { email: target } : { username: target.toLowerCase() },
  );
  if (!user) {
    console.log(`No user matches "${target}" in database "${db.databaseName}".`);
    process.exit(0);
  }

  // Say what will go, without echoing their email back to the terminal.
  console.log(`database: ${db.databaseName}`);
  console.log(`match:    ${user.username ?? "(no username)"}  id=${user._id}`);
  console.log(`  synced app data: ${user.syncData ? "yes" : "none"}`);
  console.log(`  logged days:     ${(user.scoreHistory ?? []).length}`);
  console.log(`  friends:         ${(user.friends ?? []).length}`);

  const referencedBy = await users.countDocuments({
    $or: [{ friends: user._id }, { "friendRequests.from": user._id }],
  });
  console.log(`  referenced in ${referencedBy} other user(s)`);

  if (!confirmed) {
    console.log("\nDry run. Re-run with --yes to delete.");
    process.exit(0);
  }

  // Remove references first, so nothing points at a missing account.
  const cleaned = await users.updateMany(
    { $or: [{ friends: user._id }, { "friendRequests.from": user._id }] },
    { $pull: { friends: user._id, friendRequests: { from: user._id } } },
  );
  const del = await users.deleteOne({ _id: user._id });

  console.log(`\nremoved references from ${cleaned.modifiedCount} user(s)`);
  console.log(`deleted ${del.deletedCount} account`);

  const left = await users.countDocuments({
    $or: [{ _id: user._id }, { friends: user._id }, { "friendRequests.from": user._id }],
  });
  console.log(left === 0 ? "verified: nothing referring to them remains." : `WARNING: ${left} remain.`);
} catch (err) {
  const msg = String(err?.message ?? err);
  if (/bad auth|authentication failed/i.test(msg)) {
    console.error("\nAuthentication failed — check the username and password in the URI.");
  } else if (/ETIMEDOUT|ENOTFOUND|ServerSelection/i.test(msg)) {
    console.error("\nCould not reach the cluster — check Atlas → Network Access allows your IP.");
  } else {
    console.error("\n" + msg);
  }
  process.exitCode = 1;
} finally {
  await client.close();
}
