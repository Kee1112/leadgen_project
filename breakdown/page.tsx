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
  {leadData.breakdownDetails ? (() => {
    const entries = Object.entries(leadData.breakdownDetails as Record<string, string>);
    const groupedRows: JSX.Element[] = [];
    let emailRows: { email: string; score: string; generic: string }[] = [];

    entries.forEach(([key, value], idx) => {
      if (key === "Multiple emails found") {
        // This row will be rendered after parsing the grouped emails
        return;
      }

      if (key.trim().startsWith("- ")) {
        // Parse entries like:
        // "- jrdagostino@daglawteam.com (score": "79, generic: False)"
        const emailMatch = key.match(/- ([^\s]+) \(score/);
        const scoreMatch = value.match(/^(\d+), generic: (True|False)/i);

        if (emailMatch && scoreMatch) {
          emailRows.push({
            email: emailMatch[1],
            score: scoreMatch[1],
            generic: scoreMatch[2],
          });
        }
      } else {
        // Render all normal rows
        const emailMatch = value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const phoneMatch = value.match(/\+?\d[\d\s().-]{7,}/);
        const urlMatch = value.match(/https?:\/\/[^\s]+/);

        let displayValue: JSX.Element | string = value;

// Special case: Hunter Score Email → show just the score
if (key.toLowerCase().includes("hunter score email")) {
  const scoreMatch = value.match(/\(\+?\d+\)/); // e.g., (+8)
  displayValue = scoreMatch ? scoreMatch[0].replace(/[()]/g, "") : value;
}

// Special case: Phone number + score → clickable + show score
else if (key.toLowerCase().includes("phone") && phoneMatch) {
  displayValue = (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
      <a
        href={`tel:${phoneMatch[0].replace(/[^0-9]/g, "")}`}
        className="underline text-green-300"
      >
        {phoneMatch[0]}
      </a>
      <span className="text-white font-semibold">(+10)</span>
    </div>
  );
}

// Email → link
else if (emailMatch) {
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
}

// URL → link
else if (urlMatch) {
  displayValue = (
    <a
      href={urlMatch[0]}
      className="underline text-blue-300"
      target="_blank"
      rel="noopener noreferrer"
    >
      {urlMatch[0]}
    </a>
  );
}



        groupedRows.push(
          <TableRow key={key}>
            <TableCell className="text-white font-medium px-4 py-3">
              {key.replace(/_/g, " ")}
            </TableCell>
            <TableCell className="text-white px-4 py-3">{displayValue}</TableCell>
          </TableRow>
        );
      }
    });

    // Push the grouped "multiple emails" row if emails were found
    if (emailRows.length > 0) {
      groupedRows.push(
        <TableRow key="multiple-emails">
          <TableCell className="text-white font-medium px-4 py-3">
            Multiple Emails Found
          </TableCell>
          <TableCell className="text-white px-4 py-3">
            <ul className="space-y-2">
              {emailRows.map((email, idx) => (
                <li key={idx} className="flex justify-between bg-[#330066] p-2 rounded-md">
                  <a
                    href={`mailto:${email.email}`}
                    className="underline text-blue-300 break-all"
                  >
                    {email.email}
                  </a>
                  <span className="text-sm text-gray-400 ml-4 whitespace-nowrap">
                    Score: {email.score} | Generic: {email.generic}
                  </span>
                </li>
              ))}
            </ul>
          </TableCell>
        </TableRow>
      );
    }

    return groupedRows;
  })() : (
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
        onClick={() => router.push("/results")}
        className="mt-6 underline text-pink-400 hover:text-pink-300"
>
  ← Back to Results
</button>

    </main>
  );
}

