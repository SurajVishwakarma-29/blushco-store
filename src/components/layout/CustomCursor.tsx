"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function CustomCursor() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        // Only run on desktop/devices with fine pointer and standard motion settings
        if (
            window.matchMedia("(pointer: coarse)").matches ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            return;
        }

        const updateMousePosition = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName.toLowerCase() === "a" ||
                target.tagName.toLowerCase() === "button" ||
                target.closest("a") ||
                target.closest("button")
            ) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener("mousemove", updateMousePosition);
        window.addEventListener("mouseover", handleMouseOver);

        return () => {
            window.removeEventListener("mousemove", updateMousePosition);
            window.removeEventListener("mouseover", handleMouseOver);
        };
    }, []);

    // Hide on touch devices and when users request reduced motion
    if (
        typeof window !== "undefined" &&
        (
            window.matchMedia("(pointer: coarse)").matches ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
    ) {
        return null;
    }

    return (
        <>
            <motion.div
                className="fixed top-0 left-0 w-4 h-4 rounded-full bg-foreground mix-blend-difference pointer-events-none z-[100]"
                animate={{
                    x: mousePosition.x - 8,
                    y: mousePosition.y - 8,
                    scale: isHovering ? 1.2 : 1,
                }}
                transition={{
                    type: "spring",
                    stiffness: 150,
                    damping: 15,
                    mass: 0.1,
                }}
            />
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 rounded-full border border-foreground/30 pointer-events-none z-[99]"
                animate={{
                    x: mousePosition.x - 16,
                    y: mousePosition.y - 16,
                    scale: isHovering ? 1.08 : 1,
                    opacity: isHovering ? 0.45 : 1,
                }}
                transition={{
                    type: "spring",
                    stiffness: 50,
                    damping: 20,
                    mass: 0.5,
                }}
            />
        </>
    );
}
