import type { Metadata } from "next";
import Link from "next/link";

// A real policy, not a template: every claim below was checked against the
// schema in models/User.ts and the routes that write to it. Google's OAuth
// consent screen wants this URL before an app is published, and the app asks
// strangers to sign in with Google and then stores what they eat.
export const metadata: Metadata = {
  title: "Privacy — SATTVIC",
  description: "What SATTVIC stores, why, who else sees it, and how to have it deleted.",
};

const UPDATED = "7 August 2026";
const CONTACT = "sallu21270@gmail.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="space-y-3 text-zinc-400 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-widest text-emerald-500 uppercase">Privacy</p>
        <h1 className="text-3xl font-bold text-white tracking-tight">What SATTVIC stores about you</h1>
        <p className="text-sm text-zinc-500">Last updated {UPDATED}</p>
      </div>

      <p className="text-zinc-300 leading-relaxed">
        SATTVIC is a personal project built and run by one person. It is not a company, it sells
        nothing, and it has no advertising. This page says plainly what it keeps, because a meal
        tracker knows more about you than most apps do.
      </p>

      <Section title="What is collected">
        <p>You can browse recipes, the dosha quiz and the macro calculator without an account. Nothing about you is stored until you sign in.</p>
        <p>When you sign in with Google, SATTVIC receives and stores your <strong className="text-zinc-200">name, email address and profile picture</strong>. It never sees your Google password.</p>
        <p>After that it stores what you create in the app: meals you log, your Sattvic Score history, streak and badges, your dosha result, macro targets, weight entries, weekly meal plans, fridge contents and workout logs. If you set up a public profile it also stores your username, bio and avatar emoji.</p>
      </Section>

      <Section title="Who else sees it">
        <p>Four services are involved, and none of them are given your data to use for their own purposes:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong className="text-zinc-200">Google</strong> — sign-in only.</li>
          <li><strong className="text-zinc-200">MongoDB Atlas</strong> — where the database lives.</li>
          <li><strong className="text-zinc-200">Vercel</strong> — hosting, short-lived server logs, and a page-view counter. It records that a page was opened and roughly where the visit came from. It sets no cookies, does not follow you between sites, and cannot tell one visitor from another by name.</li>
          <li><strong className="text-zinc-200">Groq</strong> — the AI features. When you type &ldquo;2 rotis and dal&rdquo; to log a meal, or paste a recipe link, that text is sent to Groq to be turned into structured food data. Your name and email are never sent with it.</li>
        </ul>
        <p>Nothing is sold, rented or shared with anyone else. There is no advertising, no tracking cookies, and nothing that follows you to other websites.</p>
      </Section>

      <Section title="What other people can see">
        <p>Your profile is <strong className="text-zinc-200">private by default</strong>. Nothing is visible to anyone else until you choose to make it public.</p>
        <p>If you make your profile public, strangers can see your username, avatar emoji, bio, streak and score. They cannot see your email, your real name, your dosha, or anything you have logged.</p>
        <p>Friends see slightly more of your score history, and still never your email or real name.</p>
      </Section>

      <Section title="Deleting your data">
        <p>
          Email <a className="text-emerald-400 hover:text-emerald-300 underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> from
          the address you signed up with and ask to be deleted. It removes your account, everything you
          logged, and every reference to you in other people&rsquo;s friend lists and pending requests.
        </p>
        <p>You can also just ask what is held about you, and you will get a straight answer.</p>
      </Section>

      <Section title="Security, honestly">
        <p>Access is decided by your signed-in session on every request, never by anything your browser claims. Sign-in goes through Google, so no password is stored here. Traffic is HTTPS only.</p>
        <p>This is a personal project rather than an audited product, so please do not put anything in it you would be seriously hurt by losing or exposing. Treat it as a meal tracker, not a medical record.</p>
      </Section>

      <Section title="Not medical advice">
        <p>Dosha results, calorie targets and macro suggestions are generated automatically, partly by AI, and are for general interest. They are not medical or dietary advice. Talk to a professional before making decisions about your health.</p>
      </Section>

      <Section title="Changes">
        <p>If what is stored changes, this page changes with it, and the date at the top moves.</p>
      </Section>

      <div className="pt-4 border-t border-white/[0.08]">
        <Link href="/" className="text-sm text-emerald-400 hover:text-emerald-300">← Back to SATTVIC</Link>
      </div>
    </div>
  );
}
