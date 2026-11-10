"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { arabicFont } from "@/lib/fonts"

type Element = {
  id: string
  title: string
  dhikr_text: string | null
  type: "quran" | "dhikr"
  target: number | null
  status: "active" | "completed"
  created_at: string
  completed_at: string | null
}

export default function CompletedPage() {

  const router = useRouter()

  const [events, setEvents] = useState<Element[]>([])
  const [loading, setLoading] = useState(true)
  
  const [quranData, setQuranData] = useState<any[]>([])
  const [dhikrData, setDhikrData] = useState<any[]>([])

  const [search, setSearch] = useState("")

  const [sort, setSort] = useState("completed_desc")

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {

    const { data } = await supabase
      .from("elements")
      .select("*")
      .eq("status", "completed")

    const { data: quranData } = await supabase
      .from("quran_juz")
      .select("element_id, completed")

    const { data: dhikrData } = await supabase
      .from("dhikr_contributions")
      .select("element_id, amount")

    setEvents(data || [])

    setQuranData(quranData || [])
    setDhikrData(dhikrData || [])

    setLoading(false)
  }

  function getQuranProgress(elementId: string) {

    const rows =
      quranData?.filter(
        (q) => q.element_id === elementId
      ) || []
  
    const done =
      rows.filter((r) => r.completed).length
  
    return done
  }
  
  function getDhikrTotal(elementId: string) {
  
    return (
      dhikrData
        ?.filter(
          (d) => d.element_id === elementId
        )
        .reduce(
          (sum, d) => sum + d.amount,
          0
        ) || 0
    )
  }

  /* Visual only: width of the progress bar */
  function getPercent(item: Element) {
    if (item.type === "quran") {
      return Math.min(100, (getQuranProgress(item.id) / 30) * 100)
    }
    if (!item.target) return 0
    return Math.min(100, (getDhikrTotal(item.id) / item.target) * 100)
  }

  const cleanText = (text : string) => {
    const tashkeelRegex = /[ًٌٍَُِّْٰۡٓ]/g; // Tashkeel and diacritics
    const specialSymbolsRegex = /[ۖۗۘۙۚۛۜ۝۞ـ]/g; // Remove any special symbols
    return text.replace(tashkeelRegex, '').replace(specialSymbolsRegex, '').replace(/[أإآٱ]/g, 'ا').replace(/ه/g, 'ة').replace(/ت/g, 'ة').replace('  ',' ').trim();
  };

  const filtered = useMemo(() => {

    let items = [...events]

    if (search.trim()) {

      const q = search.toLowerCase()

      items = items.filter(
        (e) =>
          e.title.toLowerCase().includes(q) || 
        cleanText(e.dhikr_text || "").toLowerCase().includes(cleanText(q).toLowerCase())
      )
    }

    switch (sort) {

      case "completed_desc":
        items.sort(
          (a, b) =>
            new Date(b.completed_at || "").getTime() -
            new Date(a.completed_at || "").getTime()
        )
        break

      case "completed_asc":
        items.sort(
          (a, b) =>
            new Date(a.completed_at || "").getTime() -
            new Date(b.completed_at || "").getTime()
        )
        break

      case "created_desc":
        items.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        break

      case "created_asc":
        items.sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        )
        break
    }

    return items

  }, [events, search, sort])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070B14] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#070B14] bg-[radial-gradient(ellipse_70%_35%_at_50%_0%,rgba(22,163,74,0.12),transparent)] text-white px-5 py-6">

      <div className="mx-auto max-w-2xl">

      {/* Back */}
      <button
        onClick={() => {
          setLoading(true)
      
          setTimeout(() => {
            router.back()
          }, 100)
        }}
        className="px-4 py-2 rounded-xl bg-[#111827] text-gray-200 hover:bg-[#1F2937] hover:text-white active:scale-95 transition border border-[#1F2937] hover:border-gray-600 mb-6"
      >
        Back
      </button>

      <h1 className="text-2xl font-bold tracking-tight mb-6">
        Completed Khatms ({filtered.length})
      </h1>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="
            flex-1
            bg-[#111827]
            border border-[#1F2937]
            placeholder-gray-500
            rounded-xl
            px-4 py-3
            outline-none
            focus:border-green-500
            focus:ring-2 focus:ring-green-500/20
            transition
          "
        />

        <select
          value={sort}
          onChange={(e) =>
            setSort(e.target.value)
          }
          className="
            bg-[#111827]
            border border-[#1F2937]
            rounded-xl
            px-4 py-3
            outline-none
            focus:border-green-500
            focus:ring-2 focus:ring-green-500/20
            transition
          "
        >
          <option value="completed_desc">
            Newest Completed
          </option>

          <option value="completed_asc">
            Oldest Completed
          </option>

          <option value="created_desc">
            Newest Created
          </option>

          <option value="created_asc">
            Oldest Created
          </option>
        </select>

      </div>

      {/* List */}
      <div className="space-y-4">

        {filtered.map((item) => (

          <div
            key={item.id}
            className="
              p-5
              bg-[#111827]
              border border-[#1F2937]
              rounded-2xl
              shadow-lg shadow-black/30
              opacity-70
              hover:opacity-100
              hover:border-green-600
              transition-all duration-300
            "
          >

            <div className="flex justify-between items-start">

              <Link
                href={
                  item.type === "quran"
                    ? `/quran/${item.id}`
                    : `/dhikr/${item.id}`
                }
                className="flex-1"
              >
                <h3 className="font-semibold text-lg leading-snug">
                  {item.title}
                </h3>
              </Link>

              <Link
                href={`/edit/${item.id}`}
                className="
                  px-3 py-1.5
                  rounded-lg
                  bg-green-600
                  hover:bg-green-500
                  active:scale-95
                  shadow-md shadow-green-900/30
                  transition
                  text-xs
                  font-semibold
                  ml-3
                "
              >
                Edit
              </Link>

            </div>

            <Link
              href={
                item.type === "quran"
                  ? `/quran/${item.id}`
                  : `/dhikr/${item.id}`
              }
              className="block"
            >

              <p
                className={`mt-1 text-gray-400 ${
                  item.type === "quran"
                    ? "text-sm"
                    : `${arabicFont.className} text-xl leading-relaxed`
                }`}
              >
                {item.type === "quran"
                  ? "Quran Khatm"
                  : item.dhikr_text}
              </p>

              {/* Quran Progress */}
              {item.type === "quran" && (
                <p className="text-sm mt-3 text-green-400 font-medium">
                  {getQuranProgress(item.id)} / 30 completed
                </p>
              )}

              {/* Dhikr Progress */}
              {item.type === "dhikr" && (
                <p className="text-sm mt-3 text-green-400 font-medium">
                  {getDhikrTotal(item.id).toLocaleString()} /{" "}
                  {item.target?.toLocaleString()}
                </p>
              )}

              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1F2937]">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${getPercent(item)}%` }}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
                <p className="text-xs text-gray-500">
                  Created:{" "}
                  {new Date(item.created_at).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                  })}
                </p>

                <p className="text-xs text-gray-500">
                  Completed:{" "}
                  {item.completed_at
                    ? new Date(item.completed_at).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric"
                    })
                    : "—"}
                </p>
              </div>

            </Link>

          </div>
        ))}

      </div>

      </div>

    </main>
  )
}
