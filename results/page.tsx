"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [domain, setDomain] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("leadResults");
      const storedDomain = localStorage.getItem("leadDomain");
      const storedLocation = localStorage.getItem("leadLocation");

      if (stored) setResults(JSON.parse(stored));
      if (storedDomain) setDomain(storedDomain);
      if (storedLocation) setLocation(storedLocation);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#1e003e] text-white flex flex-col items-center justify-center p-8 relative">
      {/* Glows */}
      <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-[radial-gradient(circle,#ff7f50,#dd00ff)] opacity-60 blur-3xl z-0" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-[radial-gradient(circle,#ff6a00,#ff007f)] opacity-60 blur-3xl z-0" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl">
        <h1 className="text-4xl font-bold text-center mb-4">Lead Results</h1>
        <p className="text-center mb-6 text-lg opacity-80">
          Domain: <span className="font-semibold">{domain}</span> | Location: <span className="font-semibold">{location}</span>
        </p>

        {results.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <Card className="w-full bg-white/5 backdrop-blur-md border border-white/10">
              <CardContent className="px-6 py-4">
                <Table className="w-full text-lg table-auto">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Company</TableHead>
                      <TableHead className="text-white">Website</TableHead>
                      <TableHead className="text-white">Email</TableHead>
                      <TableHead className="text-white">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...results]
                        .map((lead, index) => ({ ...lead, originalIndex: index })) // preserve original index
                        .sort((a, b) => b.score - a.score) // sort by score descending
                        .map((lead, sortedIndex) => {
                        // Determine color by rank
                        let scoreColor = "#ff66aa"; // default: reddish-pink
                        if (sortedIndex < 3) {
                            scoreColor = "#00ff88"; // top 3 = green
                        } else if (sortedIndex < 7) {
                            scoreColor = "#ffaa00"; // middle 4 = orange
                        }

                        return (
                            <TableRow key={lead.originalIndex}>
                            <TableCell className="text-white">{lead.name}</TableCell>
                            <TableCell className="text-white">
                                {lead.website ? (
                                <a
                                    href={lead.website}
                                    className="underline text-blue-300 break-all"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {lead.website}
                                </a>
                                ) : (
                                "-"
                                )}
                            </TableCell>
                            <TableCell className="text-white">
                                {lead.breakdownDetails?.["Hunter Score Email"] ? (
                                (() => {
                                    const emailWithScore = lead.breakdownDetails["Hunter Score Email"];
                                    const emailOnly = emailWithScore.match(
                                    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
                                    )?.[0];
                                    return emailOnly ? (
                                    <a href={`mailto:${emailOnly}`} className="underline text-blue-300">
                                        {emailOnly}
                                    </a>
                                    ) : (
                                    "-"
                                    );
                                })()
                                ) : (
                                "-"
                                )}
                            </TableCell>
                            <TableCell className="text-white font-bold">
                                <Link
                                href={{
                                    pathname: "/breakdown",
                                    query: { leadIndex: lead.originalIndex },
                                }}
                                className="underline"
                                style={{ color: scoreColor }}
                                >
                                {lead.score}
                                </Link>
                            </TableCell>
                            </TableRow>
                        );
                        })}
                    </TableBody>

                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-center text-lg mt-10">No results found.</p>
        )}

        <div className="flex justify-center mt-10">
          <Link href="/">
            <Button className="rounded-full bg-pink-500 hover:bg-pink-600 text-white px-6 py-2">
              ← Back to Search
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
