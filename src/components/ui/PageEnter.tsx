"use client";

import { Children, isValidElement } from "react";
import { motion } from "framer-motion";

/**
 * The dashboard's entrance, in one place.
 *
 * The dashboard fades each section up by 20px on a short stagger, and it reads
 * better than the pages that simply appear. Rather than hand-annotate every
 * section on every page, this wraps each direct child in the same motion and
 * staggers by position.
 *
 * One caveat worth knowing before reusing this: an element mid-animation carries
 * a transform, and a transform makes that element the containing block for any
 * `position: fixed` descendant. Do not wrap a section that contains a fixed
 * modal or drawer — it will anchor to the section instead of the viewport. That
 * is the same class of bug that pinned the mobile nav drawer to the top of the
 * document instead of the screen.
 */
export function PageEnter({
  children,
  className,
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <div className={className}>
      {Children.map(children, (child, i) =>
        isValidElement(child) ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            // Capped so a long page's last section is not left waiting seconds.
            transition={{ duration: 0.5, ease: "easeOut", delay: Math.min(i, 6) * stagger }}
          >
            {child}
          </motion.div>
        ) : (
          child
        ),
      )}
    </div>
  );
}
