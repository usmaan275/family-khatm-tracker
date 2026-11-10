"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function CreatePage() {
  const router = useRouter()

  const [type, setType] = useState<"quran" | "dhikr">("quran")
  const [title, setTitle] = useState("")
  const [target, setTarget] = useState("")
  const [dhikrText, setDhikrText] = useState("")
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setCreating(true)
    if (!title || (type === "dhikr" && (!dhikrText || !target || Number(target) <= 0))) {
      setCreating(false)
      return
    }

    const { data, error } = await supabase
      .from("elements")
      .insert([
        {
          type,
          title,
          target: type === "dhikr" ? Number(target) : null,
          dhikr_text: type === "dhikr" ? dhikrText : null,
          status: "active"
        }
      ])
      .select()
      .single()

    if (error) {
      console.error(error)
      alert("Error creating event")
      setCreating(false)
      return
    }
    if (type === "quran") {

      const juzRows = Array.from({ length: 30 }, (_, i) => ({
        element_id: data.id,
        juz_number: i + 1,
        assigned_name: "",
        completed: false
      }))

      const { error: juzError } = await supabase
        .from("quran_juz")
        .insert(juzRows)

      if (juzError) {
        console.error(juzError)
        alert("Error creating juz rows")
        setCreating(false)
        return
      }
    }

    router.push("/")
  }

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
    <main className="min-h-screen bg-[#070B14] bg-[radial-gradient(ellipse_70%_35%_at_50%_0%,rgba(22,163,74,0.12),transparent)] px-5 py-6 text-white">

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
        Create New Ibadah Event
      </h1>

      {/* Type Selector */}
      <div className="grid grid-cols-2 gap-1 p-1 mb-6 rounded-xl bg-[#111827] border border-[#1F2937]">
        <button
          onClick={() => setType("quran")}
          className={`px-4 py-2.5 rounded-lg font-medium transition ${type === "quran" ? "bg-green-600 text-white shadow-md shadow-green-900/30" : "text-gray-400 hover:text-white hover:bg-[#1F2937]"
            }`}
        >
          Quran Khatm
        </button>

        <button
          onClick={() => setType("dhikr")}
          className={`px-4 py-2.5 rounded-lg font-medium transition ${type === "dhikr" ? "bg-green-600 text-white shadow-md shadow-green-900/30" : "text-gray-400 hover:text-white hover:bg-[#1F2937]"
            }`}
        >
          Dhikr Khatm
        </button>
      </div>

      {/* Title */}
      <input
        className="w-full p-3.5 mb-4 rounded-xl bg-[#111827] border border-[#1F2937] text-white placeholder-gray-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
        placeholder="Title (e.g. Family Khatm for Mum)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Dhikr-only fields */}
      {type === "dhikr" && (
        <>
          <input
            className="w-full p-3.5 mb-4 rounded-xl bg-[#111827] border border-[#1F2937] text-white placeholder-gray-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
            placeholder="Dhikr text (e.g. SubhanAllah)"
            value={dhikrText}
            onChange={(e) => setDhikrText(e.target.value)}
          />

          <input
            type="text"
            inputMode="numeric"
            className="w-full p-3.5 mb-4 rounded-xl bg-[#111827] border border-[#1F2937] text-white placeholder-gray-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
            placeholder="Target amount (e.g. 70000)"
            value={target ? Number(target).toLocaleString() : ""}
            onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))}
          />
        </>
      )}

      {/* Create button */}
      <button
        onClick={handleCreate}
        className="w-full bg-green-600 hover:bg-green-500 active:scale-[0.99] transition text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-green-900/30 disabled:opacity-70"
        disabled={creating}
      >
        {creating ? "Creating..." : "Create"}
      </button>

      </div>

    </main>
  )
}
