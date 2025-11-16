"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiService } from "@/lib/api"
import { Wrench, Calendar, MapPin, User, Phone, Mail } from "lucide-react"

interface Props {
  machineId: string
  onClose?: () => void
}

export default function MachineDetail({ machineId, onClose }: Props) {
  const [machine, setMachine] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  // Service history
  const [services, setServices] = useState<any[]>([])
  const [svcPage, setSvcPage] = useState(1)
  const [svcLoading, setSvcLoading] = useState(false)
  const [svcTotalPages, setSvcTotalPages] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await apiService.getMachineById(machineId)
        const doc = res?.data?.data || res?.data || null
        setMachine(doc)
      } catch (err) {
        console.error('Failed to load machine', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [machineId])

  useEffect(() => {
    const loadServices = async () => {
      setSvcLoading(true)
      try {
        const res = await apiService.getMachineServices(machineId, svcPage, 10)
        // API may return { success, data: { docs, totalPages, totalDocs } } or plain array in data
        let docs: any[] = []
        if (res && res.data) {
          if (Array.isArray(res.data.docs)) docs = res.data.docs
          else if (Array.isArray(res.data)) docs = res.data
        }
        setServices(docs)
        // try to infer total pages
        const totalPages = res?.data?.totalPages ?? res?.data?.pages ?? res?.data?.totalPages ?? null
        if (typeof totalPages === 'number') setSvcTotalPages(totalPages)
        else if (typeof res?.data?.totalDocs === 'number') setSvcTotalPages(Math.ceil(res.data.totalDocs / 10))
      } catch (err) {
        console.error('Failed to load machine services', err)
        setServices([])
      } finally {
        setSvcLoading(false)
      }
    }
    loadServices()
  }, [machineId, svcPage])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 animate-pulse">Loading machine details...</div>
      </div>
    )
  }

  if (!machine) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="text-center text-red-500">Machine not found</div>
          {onClose && (
            <Button onClick={onClose} className="w-full mt-4">
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Machine Info Card */}
      <Card className="rounded-2xl shadow-lg">
        <CardContent className="p-6 space-y-4">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">{machine?.model || 'Unknown Model'}</h2>
                <p className="text-sm text-gray-500 mt-1">Serial: {machine?.serialNumber || '—'}</p>
              </div>
              <Badge className="rounded-full bg-[#00aeef] text-white">
                <Wrench className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Manufacturer</div>
              <div className="text-base text-gray-800">{machine?.manufacturer || '—'}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Version</div>
              <div className="text-base text-gray-800">{machine?.version || '—'}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Installed
                </div>
                <div className="text-sm text-gray-800">
                  {machine?.installedDate ? new Date(machine.installedDate).toLocaleDateString() : '—'}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last Service
                </div>
                <div className="text-sm text-gray-800">
                  {machine?.lastServicedAt ? new Date(machine.lastServicedAt).toLocaleDateString() : '—'}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 uppercase font-semibold mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Next Service Due
              </div>
              <div className="text-base font-semibold text-[#00aeef]">
                {machine?.nextServiceDue ? new Date(machine.nextServiceDue).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facility Card */}
      <Card className="rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#00aeef]" />
            Facility
          </h3>
          <div className="space-y-2">
            <div className="text-base text-gray-800 font-medium">
              {machine?.facility?.name || '—'}
            </div>
            {machine?.facility?.level && (
              <div className="text-sm text-gray-600">Level {machine.facility.level}</div>
            )}
            {machine?.facility?.location && (
              <div className="text-sm text-gray-600">{machine.facility.location}</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Card */}
      {machine?.contactPerson && (
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-[#00aeef]" />
              Contact Person
            </h3>
            <div className="space-y-2">
              <div className="text-base text-gray-800 font-medium">
                {machine.contactPerson.name || '—'}
              </div>
              {machine.contactPerson.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${machine.contactPerson.phone}`} className="text-[#00aeef]">
                    {machine.contactPerson.phone}
                  </a>
                </div>
              )}
              {machine.contactPerson.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${machine.contactPerson.email}`} className="text-[#00aeef]">
                    {machine.contactPerson.email}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes Card */}
      {machine?.notes && (
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Notes</h3>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{machine.notes}</div>
          </CardContent>
        </Card>
      )}

      {/* Service History */}
      <Card className="rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-[#00aeef]" />
            Service History
          </h3>

          {svcLoading ? (
            <div className="text-sm text-gray-600 text-center py-8 animate-pulse">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="text-sm text-gray-600 text-center py-8">No service records found.</div>
          ) : (
            <div className="space-y-3">
              {services.map((s) => (
                <div key={s._id || s.id} className="p-4 border rounded-xl bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-gray-800">{s.serviceType || s.type || 'Service'}</div>
                    <div className="text-xs text-gray-500">
                      {s.date ? new Date(s.date).toLocaleDateString() : (s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '')}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mb-1">
                    <span className="text-gray-500">Engineer:</span> {s.engineerInCharge?.name || s.engineer?.name || '—'}
                  </div>
                  {(s.notes || s.conditionAfter) && (
                    <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                      {s.notes || s.conditionAfter}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button 
              onClick={() => setSvcPage((p) => Math.max(1, p - 1))} 
              variant="outline"
              className="rounded-xl"
              disabled={svcPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm text-gray-600">
              Page {svcPage}{svcTotalPages ? ` of ${svcTotalPages}` : ''}
            </div>
            <Button 
              onClick={() => setSvcPage((p) => p + 1)} 
              variant="outline"
              className="rounded-xl"
              disabled={svcTotalPages !== null && svcPage >= svcTotalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
