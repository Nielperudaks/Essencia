"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ backgroundColor: '#e3e1e2' }}>
      {/* Background Video */}
      <div className="border-b border-border/50 p-6 py-2" style={{ backgroundColor: '#e3e1e2' }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            minWidth: '100%',
            minHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'cover'
          }}
        >
          <source src="https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/HeroSpray" type="video/mp4" />
        </video>
        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-[100%] bg-gradient-to-t from-background via-background/30 to-background/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full pt-20 mr-14 lg:mr-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="w-full lg:max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
            <span className="text-sm uppercase mb-6 block text-black animate-blur-in opacity-0 tracking-normal" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              Essencia Originals
            </span>
            <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.1] mb-6 text-balance text-black/90">
              <span className="block animate-blur-in opacity-0 font-semibold" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>Defined by</span>
              <span className="block animate-blur-in opacity-0 font-semibold xl:text-[12rem] text-6xl" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>Elegance</span>
            </h2>
            <p className="text-lg leading-relaxed mb-10 max-w-md mx-auto lg:mx-0 text-black animate-blur-in opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
              Curated fragrances, makeup essentials, and fashion pieces made to complement your lifestyle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-blur-in opacity-0" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
              <Link
                href="/shop"
                className="group inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-full text-sm tracking-wide blocks-transition hover:bg-primary/90 blocks-shadow"
              >
                Explore Collection
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 blocks-transition" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-black">
        <span className="text-xs tracking-widest uppercase font-bold">Scroll</span>
        <div className="w-px h-12 bg-foreground/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-foreground/60 animate-pulse" />
        </div>
      </div>
    </section>
  )
}
