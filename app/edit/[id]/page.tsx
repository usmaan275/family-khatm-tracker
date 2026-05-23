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
  const createdDateRef = useRef<HTMLInputElement | null>(null)
  const completedDateRef = useRef<HTMLInputElement | null>(null)

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

    await supabase
      .from("elements")
      .update({
        title: event.title,
        dhikr_text: event.dhikr_text,
        target: event.target, // ✅ ADDED
        created_at: event.created_at,
        completed_at:
          event.status === "completed"
            ? event.completed_at
            : null,
        status: event.status,
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
  
    // 1. Update local state immediately (UI responsiveness)
    const updatedEvent = {
      ...event,
      target: newTarget,
    }
  
    setEvent(updatedEvent)
  
    // 2. Save to DB
    const { error } = await supabase
      .from("elements")
      .update({
        target: newTarget,
      })
      .eq("id", event.id)
  
    if (error) {
      console.error("Failed to update target:", error)
      return
    }
  
    // 3. Recalculate dhikr total (self-contained, no external file needed)
    const { data: contributions } = await supabase
      .from("dhikr_contributions")
      .select("amount")
      .eq("element_id", event.id)
  
    const total =
      contributions?.reduce(
        (sum, c) => sum + c.amount,
        0
      ) || 0
  
    // 4. Determine correct status
    let newStatus: "active" | "completed" = "active"
  
    if (newTarget > 0 && total >= newTarget) {
      newStatus = "completed"
    }
  
    // 5. Update status if needed
    if (updatedEvent.status !== newStatus) {
      const { error: statusError } = await supabase
        .from("elements")
        .update({
          status: newStatus,
          completed_at:
            newStatus === "completed"
              ? new Date().toISOString()
              : null,
        })
        .eq("id", event.id)
  
      if (statusError) {
        console.error("Failed to update status:", statusError)
        return
      }
  
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              completed_at:
                newStatus === "completed"
                  ? new Date().toISOString()
                  : null,
            }
          : prev
      )
    }
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

  return (
    <main className="min-h-screen bg-[#070B14] text-white p-6">

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">

        <button
          onClick={() => router.push("/")}
          className="w-24 py-2 rounded-xl bg-[#111827] border border-[#1F2937] hover:bg-gray-700 hover:text-white transition"
        >
          Back
        </button>

        <h1 className="text-xl font-bold text-center">
          Edit Event
        </h1>

        <button
          onClick={save}
          disabled={saving}
          className="w-24 py-2 rounded-xl bg-green-600 hover:bg-green-500 transition"
        >
          {saving ? "Saving..." : "Done"}
        </button>
      </div>

      {/* Content Card */}
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Title */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4">
          <p className="text-sm text-gray-400 mb-2">
            Title
          </p>
          <input
            value={event.title}
            onChange={(e) =>
              updateField("title", e.target.value)
            }
            className="w-full bg-[#1F2937] p-3 rounded-xl text-white"
          />
        </div>

        {/* Dhikr Text */}
        {event.type === "dhikr" && (
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4 space-y-4">

            {/* Dhikr Text */}
            <div>
              <p className="text-sm text-gray-400 mb-2">
                Dhikr Text
              </p>

              <input
                value={event.dhikr_text || ""}
                onChange={(e) =>
                  updateField("dhikr_text", e.target.value)
                }
                className="w-full bg-[#1F2937] p-3 rounded-xl text-white"
              />
            </div>
          </div>
        )}

        {/* Dhikr Amount */}
        {event.type === "dhikr" && (
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4 space-y-4">
            {/* TARGET AMOUNT */}
            <div>
              <p className="text-sm text-gray-400 mb-2">
                Total Target Amount
              </p>

              <input
                type="number"
                value={event.target ?? 0}
                onChange={(e) =>
                  updateTarget(
                    Number(e.target.value)
                  )
                }
                className="w-full bg-[#1F2937] p-3 rounded-xl text-white text-green-400 font-bold"
              />
            </div>

          </div>
        )}

        {/* Created At */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4">
          <p className="text-sm text-gray-400 mb-2">
            Created At
          </p>

          <div
            onClick={() => createdDateRef.current?.showPicker?.()}
            className="w-full bg-[#1F2937] p-3 rounded-xl text-white cursor-pointer"
          >
            {event.created_at
              ? new Date(event.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Select date"}
          </div>

          <input
            ref={createdDateRef}
            type="date"
            className="hidden"
            value={
              event.created_at
                ? new Date(event.created_at)
                    .toISOString()
                    .split("T")[0]
                : ""
            }
            onChange={(e) => {
              const selectedDate = new Date(e.target.value)

              const existing = event.created_at
                ? new Date(event.created_at)
                : new Date()

              selectedDate.setHours(
                existing.getHours(),
                existing.getMinutes(),
                0,
                0
              )

              updateField("created_at", selectedDate.toISOString())
            }}
          />
        </div>

        {/* Completed At */}
        {event.status === "completed" && (
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4">
            <p className="text-sm text-gray-400 mb-2">
              Completed At
            </p>

            <div
              onClick={() => completedDateRef.current?.showPicker?.()}
              className="w-full bg-[#1F2937] p-3 rounded-xl text-white cursor-pointer"
            >
              {event.completed_at
                ? new Date(event.completed_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Select date"}
            </div>

            <input
              ref={completedDateRef}
              type="date"
              className="hidden"
              value={
                event.completed_at
                  ? new Date(event.completed_at)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              onChange={(e) => {
                const selectedDate = new Date(e.target.value)

                const existing = event.completed_at
                  ? new Date(event.completed_at)
                  : new Date()

                selectedDate.setHours(
                  existing.getHours(),
                  existing.getMinutes(),
                  0,
                  0
                )

                updateField(
                  "completed_at",
                  e.target.value
                    ? selectedDate.toISOString()
                    : null
                )
              }}
            />
          </div>
        )}

        {/* Delete */}
        <button
          onClick={() => setShowDelete(true)}
          className="w-full bg-[#5B1C1C] hover:bg-red-700 transition py-3 rounded-xl"
        >
          Delete Event
        </button>

        {showDelete && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-[#111827] p-6 rounded-2xl border border-[#1F2937] w-[90%] max-w-sm">

              <p className="mb-4 text-center">
                Are you sure you want to delete this event?
              </p>

              <div className="flex gap-3">

                <button
                  onClick={() => setShowDelete(false)}
                  className="flex-1 bg-[#1F2937] py-2 rounded-xl"
                >
                  No
                </button>

                <button
                  onClick={deleteEvent}
                  className="flex-1 bg-red-700 py-2 rounded-xl"
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