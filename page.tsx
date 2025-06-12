"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

export default function LeadgenPage() {
  const [domain, setDomain] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const locationRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  // 🧠 Prefill if redirected back
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const showResults = params.get("showResults");

      if (showResults === "true") {
        const storedDomain = localStorage.getItem("leadDomain");
        const storedLocation = localStorage.getItem("leadLocation");

        if (storedDomain) setDomain(storedDomain);
        if (storedLocation) setLocation(storedLocation);
      }
    }
  }, []);

  // 🚀 Handle Lead Search
  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, location }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Server returned an error:", res.status, text);
        return;
      }

      const data = await res.json();
      const leads = Array.isArray(data.results) ? data.results : [];

      // 💾 Store in localStorage
      localStorage.setItem("leadResults", JSON.stringify(leads));
      localStorage.setItem("leadDomain", domain);
      localStorage.setItem("leadLocation", location);

      // 🔁 Redirect to results page
      window.location.href = "/results";
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#1e003e] text-white flex flex-col items-center justify-center p-8 relative">
      {/* Glows */}
      <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-[radial-gradient(circle,#ff7f50,#dd00ff)] opacity-60 blur-3xl z-0" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-[radial-gradient(circle,#ff6a00,#ff007f)] opacity-60 blur-3xl z-0" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl">
        <h1 className="text-5xl font-bold text-center mb-12">Get Started</h1>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-6">
          <Input
            placeholder="ENTER DOMAIN"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && locationRef.current) {
                e.preventDefault();
                locationRef.current.focus();
              }
            }}
            className="text-center text-white border-2 border-pink-500 rounded-full bg-transparent"
          />
          <Input
            ref={locationRef}
            placeholder="ENTER LOCATION"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && domain && location) {
                handleSearch();
              }
            }}
            className="text-center text-white border-2 border-pink-500 rounded-full bg-transparent"
          />
        </div>

        <div className="flex justify-center mb-10">
          <Button
            onClick={handleSearch}
            disabled={!domain || !location}
            className="rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white font-semibold px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SEARCH
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center items-center mt-4">
            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-white">Fetching leads...</span>
          </div>
        )}
      </div>
    </main>
  );
}
