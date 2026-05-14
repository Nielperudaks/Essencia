"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Recycle, Leaf, Flower2, Globe, TrendingUp, Dna, Sparkle, Sparkles } from "lucide-react";
import { DotPattern } from "../ui/dot-pattern";
import { cn } from "@/lib/utils";


const features = [
  {
    icon: TrendingUp,
    title: "Long-Lasting Performance",
    description: "Formulated to keep you fresh and radiant all day long",
  },
  {
    icon: Leaf,
    title: "100% Natural",
    description: "No synthetic chemicals or parabens",
  },
  {
    icon: Dna,
    title: "Skin-Friendly Formula",
    description: "Carefully crafted to be gentle on all skin types",
  },
  {
    icon: Sparkles,
    title: "Certified Ingredients",
    description: "Sourced from trusted suppliers for purity and efficacy",
  },
];

export function FeatureSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const bentoRef = useRef<HTMLDivElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    const videoObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVideoVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    const headerObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (bentoRef.current) {
      observer.observe(bentoRef.current);
    }

    if (videoSectionRef.current) {
      videoObserver.observe(videoSectionRef.current);
    }

    if (headerRef.current) {
      headerObserver.observe(headerRef.current);
    }

    return () => {
      if (bentoRef.current) {
        observer.unobserve(bentoRef.current);
      }
      if (videoSectionRef.current) {
        videoObserver.unobserve(videoSectionRef.current);
      }
      if (headerRef.current) {
        headerObserver.unobserve(headerRef.current);
      }
    };
  }, []);

  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Bento Grid */}
        <div
          ref={bentoRef}
          className="grid md:grid-cols-4 mb-20 md:grid-rows-[300px_300px] gap-6"
        >
          {/* Left Large Block - Video with Overlay Card */}
          <div
            className={`relative rounded-3xl overflow-hidden h-[500px] md:h-auto md:col-span-2 md:row-span-2 transition-all duration-700 ease-out hover:scale-102 transition-transform duration-500${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            style={{ transitionDelay: "0ms" }}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source
                src="https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/Multi-Shot_Video_-_driving_her_scooter_gladly_in_the_neighborhood_early_in_the_morning%2C_looking_fres.mp4"
                type="video/mp4"
              />
            </video>
            {/* Overlay Card */}
            <div className="absolute bottom-8 left-8 right-8 bg-white p-6 shadow-lg rounded-xl">
              <DotPattern
                width={10}
                height={10}
                cx={1}
                cy={1}
                cr={1}
                className={cn(
                  "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)] opacity-80 rounded-lg absolute inset-0 pointer-events-none",
                )}
              />
              <div className="flex items-start gap-3 ">
                {/* <div className="flex-shrink-0">
                  
                </div> */}
                
                <div>
                  <h2 className="text-2xl md:text-4xl text-foreground mb-2 font-bold">
                    100% <span className="">Performance</span>
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Formulated to last all day, keeping you fresh and ready for actions.
                  </p>
                </div>
              </div>
              
            </div>
          </div>

          {/* Top Right - 100% Natural */}
          <div
            className={`rounded-3xl p-6 md:p-8 flex flex-col justify-center md:col-span-2 relative overflow-hidden transition-all duration-700 ease-out hover:scale-102 transition-transform duration-500${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            style={{ transitionDelay: "100ms" }}
          >
            {/* Background Image */}
            <Image
              src="https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/Gemini_Generated_Image_ph5919ph5919ph59.png"
              alt="Natural ingredients"
              fill
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-l from-foreground/20 to-foreground/80" />
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl text-white font-bold mb-2">
                Skin-Safe Ingredients
              </h3>
              <h3 className="text-2xl md:text-3xl text-white/70 mb-4">
                100% Natural
              </h3>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Leaf className="w-4 h-4 flex-shrink-0" />
                  <span>No Harsh Chemicals</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Flower2 className="w-4 h-4 flex-shrink-0" />
                  <span>Plant-Based Goodness</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span>Ethically Sourced</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right - Eco-Friendly Packaging */}
          <div
            className={`rounded-3xl p-6 md:p-8 flex flex-col justify-center relative overflow-hidden md:col-span-2 transition-all duration-700 ease-out hover:scale-102 transition-transform duration-500 ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            {/* Background Video */}
            <Image
              src="https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/Gemini_Generated_Image_8aez548aez548aez223.png"
              alt="Natural ingredients"
              fill
              className="absolute inset-0 w-full h-full object-cover "
            />
            <div className="absolute inset-0 bg-linear-to-b from-foreground/0  to-foreground/70" />
            {/* Overlay for text readability */}
            <div className="absolute inset-0 bg-transparent" />

            <div className="relative z-10 flex flex-col justify-end items-end h-full text-right text-white">
              <h3 className="font-sans text-4xl md:3xl font-bold mb-1 ">
                Versatile
              </h3>
              <h3 className="text-sm md:text-md mb-2 text-white/90">
                Suitable for daily use, special occasions, and seasonal
                preferences.
              </h3>
            </div>
          </div>
        </div>

        <div
          ref={videoSectionRef}
          className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center my-0 py-20"
        >
          {/* Content */}
          <div
            ref={headerRef}
            className={`transition-all duration-700 ease-out text-center ${
              isVideoVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "100ms" }}
          >
            <span
              className={`text-sm tracking-[0.3em] uppercase text-primary mb-4 block ${headerVisible ? "animate-blur-in opacity-0" : "opacity-0"}`}
              style={
                headerVisible
                  ? { animationDelay: "0.2s", animationFillMode: "forwards" }
                  : {}
              }
            >
              Why Essencia
            </span>
            <h2
              className={`font-serif text-4xl leading-tight text-foreground mb-6 text-balance md:text-7xl ${headerVisible ? "animate-blur-in opacity-0" : "opacity-0"}`}
              style={
                headerVisible
                  ? { animationDelay: "0.4s", animationFillMode: "forwards" }
                  : {}
              }
            >
              Care that breathes.
            </h2>
            <p
              className={`text-lg text-muted-foreground leading-relaxed mb-10  ${headerVisible ? "animate-blur-in opacity-0" : "opacity-0"}`}
              style={
                headerVisible
                  ? { animationDelay: "0.6s", animationFillMode: "forwards" }
                  : {}
              }
            >
              We believe skincare should be a gentle ritual, not a complicated
              routine. Every product is crafted with intention and love for your
              skin.
            </p>

            {/* Feature Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group p-5 blocks-transition hover:scale-[1.02] rounded-md border border-muted/50 hover:bg-background/70 cursor-pointer"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3 group-hover:bg-primary/20 blocks-transition bg-stone-50">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Video */}
          <div
            className={` relative aspect-[4/5] rounded-3xl overflow-hidden blocks-shadow transition-all duration-700 ease-out ${
              isVideoVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source
                src="https://4fisedqbxckj3iqj.public.blob.vercel-storage.com/feature-WOHu9u8Rlj90v6ytwrsmnNluBvDtTE"
                type="video/mp4"
              />
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}
