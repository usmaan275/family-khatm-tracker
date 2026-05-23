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
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    if (!title) {
        setLoading(false)
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
      setLoading(false)
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
          setLoading(false)
          return
        }
      }

    router.push("/")
  }

  return (
    <main className="min-h-screen p-6 bg-[#070B14] text-white">

      {/* Back */}
      <button
        onClick={() => {
          router.back()
        }}
        className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white transition border border-gray-700 mb-4"
      >
        Back
      </button>

      <h1 className="text-2xl font-bold mb-6">
        Create New Ibadah Event
      </h1>

      {/* Type Selector */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setType("quran")}
          className={`px-4 py-2 rounded ${
            type === "quran" ? "bg-green-600 text-white" : "bg-[#1F2937] text-gray-300"
          }`}
        >
          Quran Khatm
        </button>

        <button
          onClick={() => setType("dhikr")}
          className={`px-4 py-2 rounded ${
            type === "dhikr" ? "bg-green-600 text-white" : "bg-[#1F2937] text-gray-300"
          }`}
        >
          Dhikr Khatm
        </button>
      </div>

      {/* Title */}
      <input
        className="w-full p-3 mb-4 rounded-xl bg-[#111827] border border-[#1F2937] text-white placeholder-gray-400"
        placeholder="Title (e.g. Family Khatm for Mum)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Dhikr-only fields */}
      {type === "dhikr" && (
        <>
          <input
            className="w-full p-3 mb-4 rounded-xl bg-[#111827] border border-[#1F2937] text-white placeholder-gray-400"
            placeholder="Dhikr text (e.g. SubhanAllah)"
            value={dhikrText}
            onChange={(e) => setDhikrText(e.target.value)}
          />

          <input
            type="number"
            className="w-full p-3 mb-4 rounded-xl bg-[#111827] border border-[#1F2937] text-white placeholder-gray-400"
            placeholder="Target amount (e.g. 70000)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </>
      )}

      {/* Create button */}
      <button
        onClick={handleCreate}
        className="w-full bg-green-600 hover:bg-green-500 transition text-white py-3 rounded-xl shadow-lg"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create"}
      </button>

    </main>
  )
}