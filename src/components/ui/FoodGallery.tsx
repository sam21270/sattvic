"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const photos = [
  { url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700&q=85&fit=crop", label: "Rainbow Buddha Bowl",   tall: true  },
  { url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700&q=85&fit=crop", label: "Avocado Toast",         tall: false },
  { url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=700&q=85&fit=crop",    label: "Red Lentil Dal",        tall: false },
  { url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700&q=85&fit=crop", label: "Mango Salad",           tall: true  },
  { url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=700&q=85&fit=crop", label: "Paneer Tikka",          tall: false },
  { url: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=700&q=85&fit=crop", label: "Smoothie Bowl",         tall: false },
  { url: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=700&q=85&fit=crop", label: "Mushroom Risotto",      tall: true  },
  { url: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=700&q=85&fit=crop", label: "Roasted Veggie Quinoa", tall: false },
  { url: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=700&q=85&fit=crop",    label: "Nourish Bowl",          tall: false },
  { url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=700&q=85&fit=crop", label: "Palak Paneer",          tall: true  },
];

// gradient fallbacks per index so broken images still look intentional
const FALLBACKS = [
  "linear-gradient(135deg,#064e3b,#065f46)",
  "linear-gradient(135deg,#1e1b4b,#312e81)",
  "linear-gradient(135deg,#7c2d12,#9a3412)",
  "linear-gradient(135deg,#713f12,#92400e)",
  "linear-gradient(135deg,#134e4a,#0f766e)",
  "linear-gradient(135deg,#1e3a5f,#1d4ed8)",
  "linear-gradient(135deg,#3b0764,#6b21a8)",
  "linear-gradient(135deg,#0c4a6e,#0369a1)",
  "linear-gradient(135deg,#14532d,#166534)",
  "linear-gradient(135deg,#4c0519,#9f1239)",
];

function GalleryPhoto({ photo, index }: { photo: typeof photos[0]; index: number }) {
  const [broken, setBroken] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="break-inside-avoid group relative overflow-hidden rounded-2xl"
      style={{ marginBottom: "12px", background: FALLBACKS[index % FALLBACKS.length] }}
    >
      {!broken ? (
        <img
          src={photo.url}
          alt={photo.label}
          loading="lazy"
          onError={() => setBroken(true)}
          className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            photo.tall ? "h-72" : "h-44"
          }`}
        />
      ) : (
        /* fallback: show label centred over gradient */
        <div className={`w-full flex items-center justify-center ${photo.tall ? "h-72" : "h-44"}`}>
          <span className="text-white/60 text-sm font-semibold px-4 text-center">{photo.label}</span>
        </div>
      )}

      {/* hover label overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
        <span className="text-white text-sm font-semibold drop-shadow">{photo.label}</span>
      </div>
    </motion.div>
  );
}

export function FoodGallery() {
  return (
    <section className="py-24 px-4" style={{ background: "var(--gallery-bg)" }}>
      <div className="max-w-6xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">Food Gallery</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Beautiful food,<br />made for you.
          </h2>
          <p className="text-zinc-500 max-w-lg mx-auto">
            Every meal on SATTVIC is an opportunity to eat something gorgeous. Here&apos;s the kind of food we plan for.
          </p>
        </motion.div>

        <div className="columns-2 md:columns-4 gap-3 space-y-3">
          {photos.map((photo, i) => (
            <GalleryPhoto key={i} photo={photo} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
