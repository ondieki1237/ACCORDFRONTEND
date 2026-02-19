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
  categoryId?: { _id: string; name: string } // Added for backend compatibility
  manufacturerId?: { _id: string; name: string } // Added for backend compatibility
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

      console.log("Documents fetched:", dJson);

      const docsData = (Array.isArray(dJson.data) ? dJson.data : []).map((d: any) => ({
        ...d,
        category: d.category || d.categoryId,
        manufacturer: d.manufacturer || d.manufacturerId
      }))
      setDocs(docsData)
      setFiltered(docsData)

      const cats = Array.isArray(cJson.data) ? cJson.data : []
      setCategories(cats.map((c: any) => ({ _id: c._id, name: c.name })))

      const mans = Array.isArray(mJson.data) ? mJson.data : []
      setManufacturers(mans.map((m: any) => ({ _id: m._id, name: m.name })))
    } catch (e) {
      console.error("Fetch error:", e)
    }
  }

  useEffect(() => {
    let list = docs.slice()
    if (q.trim()) {
      const qq = q.trim().toLowerCase()
      list = list.filter((d) => d.title.toLowerCase().includes(qq))
    }
    if (cat) {
      list = list.filter((d) => {
        const docCat = d.category || d.categoryId;
        if (!docCat) return false;
        // Check by ID or fallback to name comparison if IDs are missing/different
        return docCat._id === cat || docCat.name?.toLowerCase() === categories.find(c => c._id === cat)?.name?.toLowerCase();
      })
    }
    if (man) {
      list = list.filter((d) => {
        const docMan = d.manufacturer || d.manufacturerId;
        if (!docMan) return false;
        return docMan._id === man || docMan.name?.toLowerCase() === manufacturers.find(m => m._id === man)?.name?.toLowerCase();
      })
    }

    // Final sorting by title
    list.sort((a, b) => a.title.localeCompare(b.title));

    setFiltered(list)
  }, [q, cat, man, docs, categories, manufacturers])

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

      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 overscroll-contain [WebkitOverflowScrolling:touch] scroll-smooth pb-10">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500 py-10 text-center bg-gray-50 rounded-xl border-2 border-dashed">
            No documents found matching your criteria.
          </div>
        ) : (
          filtered.map((d) => (
            <div
              key={d._id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-[#00aeef]/30 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="font-bold text-gray-800 text-sm truncate">{d.title}</div>
                <div className="text-xs text-gray-500 mt-2 flex flex-wrap items-center gap-2">
                  {d.manufacturer && (
                    <Badge variant="outline" className="bg-blue-50 text-[#00aeef] border-[#00aeef]/20 font-medium">
                      {d.manufacturer.name}
                    </Badge>
                  )}
                  {d.category && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                      {d.category.name}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                {d.linkUrl ? (
                  <a
                    href={d.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-[#00aeef]/10 text-[#00aeef] hover:bg-[#00aeef] hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span className="text-[10px] font-bold mt-1">OPEN</span>
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 font-medium italic">No link</span>
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
