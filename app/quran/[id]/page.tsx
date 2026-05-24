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

  async function checkQuranCompletion(
    updated: JuzRow[]
  ) {
    const allDone = updated.every(
      (j) => j.completed
    )
  
    if (allDone && updated.length === 30) {
      await supabase
        .from("elements")
        .update({
          status: "completed",
          completed_at:
            new Date().toISOString(),
        })
        .eq("id", id)
    } else {
      await supabase
        .from("elements")
        .update({
          status: "active",
          completed_at: null,
        })
        .eq("id", id)
    }
  }

  async function updateName(
    juzId: string,
    value: string
  ) {
    setJuzList((prev) =>
      prev.map((j) =>
        j.id === juzId
          ? { ...j, assigned_name: value }
          : j
      )
    )
  
    await supabase
      .from("quran_juz")
      .update({
        assigned_name: value,
      })
      .eq("id", juzId)
  }
  
  async function updateCompleted(
    juzId: string,
    value: boolean
  ) {
    const updated = juzList.map((j) =>
      j.id === juzId
        ? { ...j, completed: value }
        : j
    )
  
    setJuzList(updated)
  
    await supabase
      .from("quran_juz")
      .update({
        completed: value,
      })
      .eq("id", juzId)
  
    await checkQuranCompletion(updated)
  }

  async function handleDone() {
    setSaving(true)
  
    router.push("/")
  
    setTimeout(() => {
      router.refresh()
    }, 100)
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

    {/* Top Bar */}
    <div className="flex items-center justify-between">

      {/* Back */}
      <button
        onClick={handleDone}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white transition border border-gray-700"
      >
        Back
      </button>

      {/* Done */}
      <button
        onClick={handleDone}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-70 transition text-white font-medium"
      >
        {saving ? "Saving..." : "Done"}
      </button>

    </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mt-3">
        {khatmTitle || "Quran Khatm"}
      </h1>

      {/* Progress */}
      <p className="text-green-400 mt-1">
        {juzList.filter((j) => j.completed).length} / 30 completed
      </p>

      {/* Allocation Status */}
      {(() => {
        const allocated = juzList.filter(
          (j) => j.assigned_name?.trim()
        ).length

        const remaining = 30 - allocated

        if (allocated === 0 || allocated === 30) {
          return null
        }

        return (
          <p className="text-gray-400 text-sm mt-1">
            There {remaining === 1 ? "is" : "are"}{" "}
            {remaining} unallocated juz remaining
          </p>
        )
      })()}

      {/* List */}
      <div className="space-y-3 mt-4">

        {juzList.map((juz) => (

          <div
            key={juz.id}
            className={`rounded-2xl p-4 flex items-center gap-3 border transition ${
              juz.completed
                ? "bg-green-900/20 border-green-700"
                : "bg-[#111827] border-[#1F2937]"
            }`}
          >

            {/* Juz */}
            <div className="w-16 font-semibold">
              Juz {juz.juz_number}
            </div>

            {/* Name input */}
            <input
              type="text"
              value={juz.assigned_name ?? ""}
              onChange={(e) =>
                updateName(
                  juz.id,
                  e.target.value
                )
              }
              className="flex-1 p-2 rounded bg-[#1F2937] text-white"
              placeholder="Name"
            />

            {/* Checkbox */}
            <input
              type="checkbox"
              checked={juz.completed}
              onChange={(e) =>
                updateCompleted(
                  juz.id,
                  e.target.checked
                )
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
            className="w-full bg-green-600 hover:bg-green-500 transition py-3 rounded-xl font-semibold disabled:opacity-70"
          >
            {saving ? "Saving..." : "Done"}
          </button>

        </div>

      </div>

    </main>
  )
}