import React, { useEffect, useState } from "react"
import { apiService } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface VisitHistorySelectorProps {
  onSelect: (facility: any) => void
  selectedVisitId: string
}

export function VisitHistorySelector({ onSelect, selectedVisitId }: VisitHistorySelectorProps) {
  const [visits, setVisits] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('https://app.codewithseth.co.ke/api/facilities/visited', {
      headers: {
        'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        const facilities = Array.isArray(data.data) ? data.data : []
        setVisits(facilities)
      })
      .catch(() => setVisits([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = visits.filter(f => {
    const name = f.name || ""
    const location = f.location || ""
    return name.toLowerCase().includes(search.toLowerCase()) || location.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <Card className="mt-4">
      <CardContent>
        <div className="mb-2">
          <Input
            placeholder="Search previous facilities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mb-2"
          />
        </div>
        {loading ? (
          <div className="text-sm text-gray-500">Loading visited facilities...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-500">No visited facilities found.</div>
        ) : (
          <ul className="max-h-64 overflow-auto divide-y">
            {filtered.map(f => (
              <li
                key={f.name + f.location + f.level}
                className={`py-2 px-2 cursor-pointer rounded ${selectedVisitId === (f.name + f.location + f.level) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => onSelect(f)}
              >
                <div className="font-medium text-base">{f.name}</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}