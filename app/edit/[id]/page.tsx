"use client"

import { useEffect, useState, use, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type ElementData = {
  id: string
  title: string
  dhikr_text: string | null
  type: "quran" | "dhikr"
  target: number | null
  status: "active" | "completed"
  created_at: string
  completed_at: string | null
}

export default function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)

  const [event, setEvent] = useState<ElementData | null>(null)
  const [saving, setSaving] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const [showCreatedPicker, setShowCreatedPicker] = useState(false)
  const [showCompletedPicker, setShowCompletedPicker] = useState(false)

  useEffect(() => {
    fetchEvent()
  }, [])

  async function fetchEvent() {
    const { data } = await supabase
      .from("elements")
      .select("*")
      .eq("id", id)
      .single()

    setEvent(data)
  }

  function updateField<K extends keyof ElementData>(
    key: K,
    value: ElementData[K]
  ) {
    if (!event) return

    setEvent({
      ...event,
      [key]: value,
    })
  }

  async function save() {
    if (!event) return

    setSaving(true)

    const { data: contributions } = await supabase
      .from("dhikr_contributions")
      .select("amount")
      .eq("element_id", event.id)

    const total =
      contributions?.reduce((sum, c) => sum + c.amount, 0) || 0

    let newStatus: "active" | "completed" = "active"

    if (event.target && total >= event.target) {
      newStatus = "completed"
    }

    await supabase
      .from("elements")
      .update({
        title: event.title,
        dhikr_text: event.dhikr_text,
        target: event.target,
        created_at: event.created_at,
        completed_at:
          newStatus === "completed"
            ? event.completed_at || new Date().toISOString()
            : null,
        status: newStatus,
      })
      .eq("id", event.id)

    setLeaving(true)
    router.push("/")
    setTimeout(() => router.refresh(), 100)
  }

  async function deleteEvent() {
    if (!event) return

    await supabase
      .from("elements")
      .delete()
      .eq("id", event.id)

    setLeaving(true)
    router.push("/")
    setTimeout(() => router.refresh(), 100)
  }

  async function updateTarget(value: number) {
    if (!event) return

    const newTarget = Number(value)

    setEvent({
      ...event,
      target: newTarget,
    })
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-[#070B14] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </main>
    )
  }

  // helpers for splitting dates
  const created = event.created_at ? new Date(event.created_at) : null
  const completed = event.completed_at ? new Date(event.completed_at) : null

  function updateCreated(d: number, m: number, y: number) {
    if (!created) return
    const updated = new Date(created)
    updated.setDate(d)
    updated.setMonth(m - 1)
    updated.setFullYear(y)
    updateField("created_at", updated.toISOString())
  }

  function updateCompleted(d: number, m: number, y: number) {
    if (!completed) return
    const updated = new Date(completed)
    updated.setDate(d)
    updated.setMonth(m - 1)
    updated.setFullYear(y)
    updateField("completed_at", updated.toISOString())
  }

  return (
    <main className="min-h-screen bg-[#070B14] text-white p-6">

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">

        <button
          onClick={() => {
            router.back()

            setTimeout(() => {
              router.refresh()
            }, 100)
          }}
          className="w-24 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white transition border border-gray-700"
        >
          Back
        </button>

        <h1 className="text-xl font-bold text-center">
          Edit Khatm
        </h1>

        <button
          onClick={save}
          disabled={saving}
          className="w-24 py-2 rounded-xl bg-green-600 hover:bg-green-500 transition"
        >
          {saving ? "Saving..." : "Done"}
        </button>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">

        {/* Title */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4">
          <p className="text-sm text-gray-400 mb-2">Title</p>
          <input
            value={event.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full bg-[#1F2937] p-3 rounded-xl text-white"
          />
        </div>

        {/* Dhikr Text */}
        {event.type === "dhikr" && (
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4 space-y-4">
            <p className="text-sm text-gray-400 mb-2">Dhikr Text</p>
            <input
              value={event.dhikr_text || ""}
              onChange={(e) => updateField("dhikr_text", e.target.value)}
              className="w-full bg-[#1F2937] p-3 rounded-xl text-white"
            />
          </div>
        )}

        {/* Target */}
        {event.type === "dhikr" && (
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4">
            <p className="text-sm text-gray-400 mb-2">Total Target Amount</p>
            <input
              type="text"
              inputMode="numeric"
              value={event.target ? Number(event.target).toLocaleString() : ""}
              onChange={(e) => updateTarget(Number(e.target.value.replace(/\D/g, "")))}
              className="w-full bg-[#1F2937] p-3 rounded-xl text-white text-green-400"
            />
          </div>
        )}

        {/* CREATED DATE (3-part editor) */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4">
          <p className="text-sm text-gray-400 mb-3">Created At</p>

          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              placeholder="DD"
              value={created ? created.getDate() : ""}
              onChange={(e) =>
                updateCreated(
                  Number(e.target.value),
                  created ? created.getMonth() + 1 : 1,
                  created ? created.getFullYear() : 2026
                )
              }
              className="bg-[#1F2937] p-2 rounded text-white"
            />

            <input
              type="number"
              placeholder="MM"
              value={created ? created.getMonth() + 1 : ""}
              onChange={(e) =>
                updateCreated(
                  created ? created.getDate() : 1,
                  Number(e.target.value),
                  created ? created.getFullYear() : 2026
                )
              }
              className="bg-[#1F2937] p-2 rounded text-white"
            />

            <input
              type="number"
              placeholder="YYYY"
              value={created ? created.getFullYear() : ""}
              onChange={(e) =>
                updateCreated(
                  created ? created.getDate() : 1,
                  created ? created.getMonth() + 1 : 1,
                  Number(e.target.value)
                )
              }
              className="bg-[#1F2937] p-2 rounded text-white"
            />
          </div>
        </div>

        {/* COMPLETED DATE (3-part editor) */}
        {event.status === "completed" && (
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4">
            <p className="text-sm text-gray-400 mb-3">Completed At</p>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="DD"
                value={completed ? completed.getDate() : ""}
                onChange={(e) =>
                  updateCompleted(
                    Number(e.target.value),
                    completed ? completed.getMonth() + 1 : 1,
                    completed ? completed.getFullYear() : 2026
                  )
                }
                className="bg-[#1F2937] p-2 rounded text-white"
              />

              <input
                type="number"
                placeholder="MM"
                value={completed ? completed.getMonth() + 1 : ""}
                onChange={(e) =>
                  updateCompleted(
                    completed ? completed.getDate() : 1,
                    Number(e.target.value),
                    completed ? completed.getFullYear() : 2026
                  )
                }
                className="bg-[#1F2937] p-2 rounded text-white"
              />

              <input
                type="number"
                placeholder="YYYY"
                value={completed ? completed.getFullYear() : ""}
                onChange={(e) =>
                  updateCompleted(
                    completed ? completed.getDate() : 1,
                    completed ? completed.getMonth() + 1 : 1,
                    Number(e.target.value)
                  )
                }
                className="bg-[#1F2937] p-2 rounded text-white"
              />
            </div>
          </div>
        )}

        {/* Delete */}
        <button
          onClick={() => setShowDelete(true)}
          className="w-full bg-[#5B1C1C] hover:bg-red-700 transition py-3 rounded-2xl"
        >
          Delete Khatm
        </button>

        {showDelete && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] w-[90%] max-w-sm">

              <p className="mb-4 text-center">
                Are you sure you want to delete this khatm?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDelete(false)}
                  className="flex-1 py-3 rounded-2xl bg-[#1F2937] hover:bg-[#374151] transition font-semibold"
                >
                  No
                </button>

                <button
                  onClick={deleteEvent}
                  className="flex-1 py-3 rounded-2xl bg-red-700 hover:bg-red-600 transition font-semibold"
                >
                  Yes
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  )
}