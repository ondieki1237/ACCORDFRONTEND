"use client";

import { useRouter } from "next/navigation";
import { VisitList } from "@/components/visits/visit-list";

export default function VisitsPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">All Visits</h1>
      <VisitList
        onCreateVisit={() => router.push("/visits/new")}
        onViewVisit={(visit) => router.push(`/visits/${visit._id}`)}
      />
    </div>
  );
}