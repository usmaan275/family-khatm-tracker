"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { use } from "react"
import { useRouter } from "next/navigation"

type JuzRow = {
  id: string
  juz_number: number
  assigned_name: string
  completed: boolean
}

export default function QuranPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {

  const router = useRouter()
  const { id } = use(params)

  const [juzList, setJuzList] = useState<JuzRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [khatmTitle, setKhatmTitle] = useState("")

  // LOCAL STATE (IMPORTANT FIX)
  const [localNames, setLocalNames] = useState<Record<string, string>>({})
  const [localCompleted, setLocalCompleted] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchJuz()
  }, [])

  async function fetchJuz() {

    const { data, error } = await supabase
      .from("quran_juz")
      .select("*")
      .eq("element_id", id)
      .order("juz_number")

    const { data: elementData } = await supabase
      .from("elements")
      .select("title")
      .eq("id", id)
      .single()

    setKhatmTitle(elementData?.title || "")

    if (error) {
      console.error(error)
      return
    }

    setJuzList(data || [])
    setLoading(false)
  }

  // INIT LOCAL STATE ON FIRST LOAD
  useEffect(() => {
    const names: Record<string, string> = {}
    const completed: Record<string, boolean> = {}

    juzList.forEach((j) => {
      names[j.id] = j.assigned_name || ""
      completed[j.id] = j.completed
    })

    setLocalNames(names)
    setLocalCompleted(completed)
  }, [juzList])

  async function checkQuranCompletion(updated: JuzRow[]) {

    const allDone = updated.every((j) => j.completed)

    if (allDone && updated.length === 30) {

      await supabase
        .from("elements")
        .update({ status: "completed" })
        .eq("id", id)
    }
  }

  async function handleDone() {

    setSaving(true)
  
    const updates = juzList.map((juz) => {
      return supabase
        .from("quran_juz")
        .update({
          assigned_name: localNames[juz.id] ?? juz.assigned_name,
          completed: localCompleted[juz.id] ?? juz.completed,
        })
        .eq("id", juz.id)
    })
  
    await Promise.all(updates)
  
    // REFETCH latest state AFTER save
    const { data } = await supabase
      .from("quran_juz")
      .select("completed")
      .eq("element_id", id)
  
    const allDone = data?.every((j) => j.completed === true)
  
    if (allDone && data?.length === 30) {
      await supabase
        .from("elements")
        .update({ status: "completed" })
        .eq("id", id)
    }
  
    setSaving(false)
  
    router.push("/")
    router.refresh()
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
    <main className="min-h-screen bg-[#070B14] text-white p-6">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-gray-300 hover:text-white transition"
      >
        ← Back
      </button>

      {/* Title */}
      <h1 className="text-2xl font-bold mt-3">
        {khatmTitle || "Quran Khatm"}
      </h1>

      {/* Progress */}
      <p className="text-green-400 mt-1">
        {juzList.filter((j) => localCompleted[j.id]).length} / 30 completed
      </p>

      {/* List */}
      <div className="space-y-3 mt-4">

        {juzList.map((juz) => (

          <div
            key={juz.id}
            className={`rounded-2xl p-4 flex items-center gap-3 border transition ${
              localCompleted[juz.id]
                ? "bg-green-900/20 border-green-700"
                : "bg-[#111827] border-[#1F2937]"
            }`}
          >

            {/* Juz */}
            <div className="w-16 font-semibold">
              Juz {juz.juz_number}
            </div>

            {/* Name input (LOCAL ONLY) */}
            <input
              type="text"
              value={localNames[juz.id] ?? ""}
              onChange={(e) =>
                setLocalNames((prev) => ({
                  ...prev,
                  [juz.id]: e.target.value,
                }))
              }
              className="flex-1 p-2 rounded bg-[#1F2937] text-white"
              placeholder="Name"
            />

            {/* Checkbox (LOCAL ONLY) */}
            <input
              type="checkbox"
              checked={localCompleted[juz.id] ?? false}
              onChange={(e) =>
                setLocalCompleted((prev) => ({
                  ...prev,
                  [juz.id]: e.target.checked,
                }))
              }
              className="w-5 h-5 accent-green-600"
            />

          </div>
        ))}

        {/* DONE BUTTON */}
        <div className="mt-10">

          <button
            onClick={handleDone}
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-500 transition py-3 rounded-xl font-semibold"
          >
            {saving ? "Saving..." : "Done"}
          </button>

        </div>

      </div>

    </main>
  )
}