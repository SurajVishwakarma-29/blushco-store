"use client";

import { motion } from "framer-motion";

const items = [
    "NEW ARRIVALS",
    "EXCLUSIVE DROPS",
    "FREE WORLDWIDE SHIPPING OVER $200",
    "REDEFINING STREETWEAR",
    "SHOP THE LOOK",
];

export function Marquee() {
    return (
        <div className="w-full overflow-hidden bg-foreground py-4 border-y border-border">
            <div className="flex w-[200%] md:w-[150%]">
                <motion.div
                    className="flex whitespace-nowrap gap-12"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 25,
                    }}
                >
                    {/* Output items multiple times to ensure smooth infinite scroll visually */}
                    {[...items, ...items, ...items, ...items].map((text, idx) => (
                        <div
                            key={idx}
                            className="flex items-center text-background font-black tracking-tighter text-2xl md:text-3xl uppercase"
                        >
                            {text}
                            <span className="ml-12 inline-block w-2 h-2 rounded-full bg-background" />
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
