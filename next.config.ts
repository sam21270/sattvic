import type { NextConfig } from "next";

// Security headers. The app takes Google sign-ins, so the session cookie is
// worth protecting: framing enables clickjacking a signed-in user, and a
// referrer carrying a username leaks who is using the app to third parties.
const securityHeaders = [
  // Never render the app inside someone else's iframe.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Don't let a browser second-guess a declared content type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the origin cross-site, never the full path (which can hold a username).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here needs these devices.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HTTPS only once seen. Vercel redirects already; this covers the first hop.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // don't advertise the framework version
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
