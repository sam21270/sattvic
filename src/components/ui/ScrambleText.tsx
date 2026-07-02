"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&";

interface ScrambleTextProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
}

export function ScrambleText({ text, className, delay = 0, speed = 40 }: ScrambleTextProps) {
  const [display, setDisplay] = useState("");
  const raf = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let iteration = 0;
      const total = text.length;

      const step = () => {
        setDisplay(
          text
            .split("")
            .map((char, i) => {
              if (char === " ") return " ";
              if (i < iteration) return text[i];
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join("")
        );
        iteration += 0.4;
        if (iteration < total + 1) {
          raf.current = setTimeout(step, speed);
        } else {
          setDisplay(text);
        }
      };
      step();
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (raf.current) clearTimeout(raf.current);
    };
  }, [text, delay, speed]);

  return <span className={className}>{display || text}</span>;
}
