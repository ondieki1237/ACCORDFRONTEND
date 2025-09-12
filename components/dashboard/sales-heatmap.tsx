"use client";
import { useEffect, useState } from "react"

interface HeatmapItem {
  userId: string
  userName: string
  location: string
  count: number
}

export default function SalesHeatmap() {
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([])

  useEffect(() => {
    fetch("http://localhost:5000/api/dashboard/heatmap/sales")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHeatmap(data.data)
        }
      })
      .catch((err) => console.error("Error fetching heatmap:", err))
  }, [])

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Sales Heatmap</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Sales Rep</th>
            <th className="p-2">Location</th>
            <th className="p-2">Visits</th>
          </tr>
        </thead>
        <tbody>
          {heatmap.map((item) => (
            <tr key={`${item.userId}-${item.location}`}>
              <td className="p-2">{item.userName}</td>
              <td className="p-2">{item.location}</td>
              <td className="p-2">{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
