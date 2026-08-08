import type { MetadataRoute } from "next";

// /robots.txt was a 404. The API routes are disallowed not for secrecy — they
// check the session themselves — but because there is nothing there to index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: "https://sattvic.vercel.app/sitemap.xml",
  };
}
