"use client"

import { useParams } from "next/navigation"
import MachineDetail from "@/components/machines/machine-detail"

// Required for static export - return empty array to allow dynamic runtime rendering
export function generateStaticParams() {
  return []
}

export default function MachinePage() {
  const params = useParams()
  const id = params?.id as string

  if (!id) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#e6ecf5] to-[#d1dbe9] p-4">
        <div className="text-center text-red-500 mt-8">Invalid machine ID</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e6ecf5] to-[#d1dbe9] p-4 pb-24">
      <MachineDetail machineId={id} />
    </main>
  )
}
