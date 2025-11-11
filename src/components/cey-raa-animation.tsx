"use client"

import './cey-raa-animation.css';

export function CeyRaaAnimation() {
    return (
        <div className="relative">
             <div className="absolute -inset-2.5">
                <div className="w-full h-full max-w-sm mx-auto lg:mx-0 opacity-30 blur-lg bg-gradient-to-r from-primary via-accent to-primary-foreground"></div>
            </div>
            <h1 className="cey-raa-text relative text-5xl md:text-7xl font-bold text-foreground tracking-tighter font-headline">
                CeyRaa
            </h1>
        </div>
    )
}
