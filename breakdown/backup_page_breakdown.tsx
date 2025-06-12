// File: app/breakdown/page.tsx


"use client";
import React, { JSX } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";





export default function BreakdownPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leadData, setLeadData] = useState<any>(null);

  useEffect(() => {
    const index = Number(searchParams.get("leadIndex"));
    if (!isNaN(index)) {
      const stored = localStorage.getItem("leadResults");
      if (stored) {
        const leads = JSON.parse(stored);
        if(Array.isArray(leads) && leads[index]){
            setLeadData(leads[index]);
        }
        

}

    }
  }, [searchParams]);

  if (!leadData) {
    return <p className="text-center mt-10 text-white">Invalid lead selected.</p>;
  }

  return (
    <main className="min-h-screen bg-[#1e003e] text-white flex flex-col items-center justify-start p-10">
      <h1 className="text-4xl font-bold mb-6">Score Breakdown for {leadData.name}</h1>

      <Card className="w-full max-w-4xl bg-white/5 border border-white/10">
        <CardContent className="overflow-x-auto p-6">
          <Table className="w-full text-lg">
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Parameter</TableHead>
                <TableHead className="text-white">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {leadData.breakdownDetails ? (
                    Object.entries(leadData.breakdownDetails as Record<string, string>).map(
                    ([key, value]) => {
                        // Detect content type
                        const emailMatch = value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                        const phoneMatch = value.match(/\+?\d[\d\s().-]{7,}/);
                        const urlMatch = value.match(/https?:\/\/[^\s]+/);

                        let displayValue: string | JSX.Element = value;

                        if (emailMatch) {
                        displayValue = (
                            <a
                            href={`mailto:${emailMatch[0]}`}
                            className="underline text-yellow-300"
                            target="_blank"
                            rel="noopener noreferrer"
                            >
                            {emailMatch[0]}
                            </a>
                        );
                        } else if (phoneMatch) {
                        displayValue = (
                            <a
                            href={`tel:${phoneMatch[0].replace(/\s+/g, "")}`}
                            className="underline text-green-400"
                            >
                            {phoneMatch[0]}
                            </a>
                        );
                        } else if (urlMatch) {
                        displayValue = (
                            <a
                            href={urlMatch[0]}
                            className="underline text-blue-400"
                            target="_blank"
                            rel="noopener noreferrer"
                            >
                            {urlMatch[0]}
                            </a>
                        );
                        }

                        return (
                        <TableRow key={key}>
                            <TableCell className="text-white font-medium px-4 py-3">{key}</TableCell>
                            <TableCell className="text-white px-4 py-3">{displayValue}</TableCell>
                        </TableRow>
                        );
                    }
                    )
                ) : (
                    <TableRow>
                    <TableCell colSpan={2} className="text-white text-center py-4">
                        No breakdown details available.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>



          </Table>
        </CardContent>
      </Card>

      <button
        onClick={() => router.push("/?showResults=true")}
        className="mt-6 underline text-pink-400 hover:text-pink-300"
>
  ← Back to Results
</button>

    </main>
  );
}