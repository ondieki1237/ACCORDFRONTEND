"use client"
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import { SheetClose } from "@/components/ui/sheet"

type Doc = {
  _id: string
  title: string
  linkUrl?: string
  category?: { _id: string; name: string }
  manufacturer?: { _id: string; name: string }
}

export default function DocumentsViewer({ onClose }: { onClose?: () => void }) {
  const [docs, setDocs] = useState<Doc[]>([])
  const [filtered, setFiltered] = useState<Doc[]>([])
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([])
  const [manufacturers, setManufacturers] = useState<{ _id: string; name: string }[]>([])
  const [q, setQ] = useState("")
  const [cat, setCat] = useState<string | null>(null)
  const [man, setMan] = useState<string | null>(null)
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "https://app.codewithseth.co.ke/api"

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [dRes, cRes, mRes] = await Promise.all([
        fetch(`${API}/sales/documents`),
        fetch(`${API}/document-categories`),
        fetch(`${API}/manufacturers`),
      ])

      const dJson = await dRes.json()
      const cJson = await cRes.json()
      const mJson = await mRes.json()

      const docsData = Array.isArray(dJson.data) ? dJson.data : []
      setDocs(docsData)
      setFiltered(docsData)

      const cats = Array.isArray(cJson.data) ? cJson.data : []
      setCategories(cats.map((c: any) => ({ _id: c._id, name: c.name })))

      const mans = Array.isArray(mJson.data) ? mJson.data : []
      setManufacturers(mans.map((m: any) => ({ _id: m._id, name: m.name })))
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    let list = docs.slice()
    if (q.trim()) {
      const qq = q.trim().toLowerCase()
      list = list.filter((d) => d.title.toLowerCase().includes(qq))
    }
    if (cat) list = list.filter((d) => d.category && d.category._id === cat)
    if (man) list = list.filter((d) => d.manufacturer && d.manufacturer._id === man)
    setFiltered(list)
  }, [q, cat, man, docs])

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Documents</h3>
          <p className="text-sm text-gray-500">View product manuals and links (read-only)</p>
        </div>
        {/* ensure top-right close is obvious on small screens too */}
        <div className="ml-2">
          <SheetClose>
            <button className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm">Close</button>
          </SheetClose>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <Label className="text-sm">Search</Label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents" />
        </div>
        <div className="w-48">
          <Label className="text-sm">Category</Label>
          <Select onValueChange={(v) => setCat(v === "__all" ? null : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Label className="text-sm">Manufacturer</Label>
          <Select onValueChange={(v) => setMan(v === "__all" ? null : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All manufacturers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All</SelectItem>
              {manufacturers.map((m) => (
                <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500">No documents found.</div>
        ) : (
          filtered.map((d) => (
            <div key={d._id} className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm transition">
              <div>
                <div className="font-semibold text-sm">{d.title}</div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  {d.manufacturer && <Badge className="bg-gray-100 text-gray-700">{d.manufacturer.name}</Badge>}
                  {d.category && <Badge className="bg-gray-100 text-gray-700">{d.category.name}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {d.linkUrl ? (
                  <a href={d.linkUrl} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-2 hover:underline">
                    View <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <span className="text-sm text-gray-400">No preview</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <SheetClose>
          <button className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50">Close</button>
        </SheetClose>
      </div>
    </div>
  )
}
