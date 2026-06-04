"use client";

import { motion } from "framer-motion";

export function DeliverablesProgressBar() {
  return (
    <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-paper/10">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light"
        initial={{ width: "12%" }}
        animate={{ width: ["12%", "68%", "42%", "78%"] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
