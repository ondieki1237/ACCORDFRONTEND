"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { apiService } from "@/lib/api"
import { Search } from "lucide-react"
import MachineDetail from "./machine-detail"

interface Machine {
  _id: string
  serialNumber?: string
  model?: string
  manufacturer?: string
  version?: string
  facility?: { name?: string; level?: string; location?: string }
  installedDate?: string
  lastServicedAt?: string
  nextServiceDue?: string
  lastServiceEngineer?: any
}

export function MachineList() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const fetchMachines = async (q = "", p = 1) => {
    setLoading(true)
    try {
      const filters: any = {}
      if (q) filters.search = q
      const res = await apiService.getMachines(p, 20, filters)
      // backend likely returns { success, data: { docs: [], totalDocs } } or array
      let docs: any[] = []
      if (res && res.data) {
        docs = Array.isArray(res.data.docs) ? res.data.docs : (Array.isArray(res.data) ? res.data : [])
      }
      setMachines(docs)
    } catch (err) {
      console.error('Failed to load machines', err)
      setMachines([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMachines(query, page)
  }, [query, page])

  const onSelect = (m: Machine) => {
    setSelectedMachine(m)
    setShowDetail(true)
  }

  const handleClose = () => {
    setShowDetail(false)
    setSelectedMachine(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search machines by model, serial, facility..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>
        <Button onClick={() => fetchMachines(query, 1)}>
          <Search className="h-4 w-4 mr-2" /> Search
        </Button>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <div>Loading machines...</div>
        ) : machines.length === 0 ? (
          <Card className="rounded-xl p-4">
            <CardContent>No machines found.</CardContent>
          </Card>
        ) : (
          machines.map((m) => (
            <Card key={m._id} className="p-3 rounded-xl">
              <CardContent className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{m.model || 'Unknown Model'}</div>
                  <div className="text-sm text-gray-500">{m.serialNumber || ''} • {m.manufacturer || ''}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.facility?.name || ''} {m.facility?.level ? `• L${m.facility.level}` : ''}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="rounded-full">{m.nextServiceDue ? `Due ${new Date(m.nextServiceDue).toLocaleDateString()}` : 'No Due Date'}</Badge>
                  <Button variant="ghost" onClick={() => onSelect(m)}>View</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="flex justify-between items-center">
        <Button onClick={() => setPage((p) => Math.max(1, p - 1))} variant="outline">Prev</Button>
        <div>Page {page}</div>
        <Button onClick={() => setPage((p) => p + 1)} variant="outline">Next</Button>
      </div>

      {/* Machine Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Machine Details</DialogTitle>
          </DialogHeader>
          {selectedMachine && (
            <MachineDetail machineId={selectedMachine._id} onClose={handleClose} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MachineList
