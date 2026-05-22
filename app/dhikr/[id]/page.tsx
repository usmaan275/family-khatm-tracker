"use client"

import { use, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type Contribution = {
  id: string
  name: string
  amount: number
}

type ElementData = {
  id: string
  title: string
  dhikr_text: string
  target: number
}

export default function DhikrPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {

  const router = useRouter()

  const { id } = use(params)

  const [event, setEvent] = useState<ElementData | null>(null)

  const [contributions, setContributions] = useState<
    Contribution[]
  >([])

  const [newName, setNewName] = useState("")
  const [newAmount, setNewAmount] = useState("")

  const [saving, setSaving] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {

    /* Event */
    const { data: eventData } = await supabase
      .from("elements")
      .select("*")
      .eq("id", id)
      .single()

    setEvent(eventData)

    /* Contributions */
    const { data: contributionData } = await supabase
      .from("dhikr_contributions")
      .select("*")
      .eq("element_id", id)

    setContributions(contributionData || [])
  }

  async function addContribution() {

    if (!newName.trim()) return
    if (!newAmount) return

    setSaving(true)

    const existing = contributions.find(
      (c) =>
        c.name.toLowerCase() ===
        newName.trim().toLowerCase()
    )

    /* Existing person */
    if (existing) {

      const updatedAmount =
        existing.amount + Number(newAmount)

      const { error } = await supabase
        .from("dhikr_contributions")
        .update({
          amount: updatedAmount,
        })
        .eq("id", existing.id)

      if (error) {
        console.error(error)
        setSaving(false)
        return
      }

      setContributions((prev) =>
        prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                amount: updatedAmount,
              }
            : c
        )
      )

    } else {

      /* New person */
      const { data, error } = await supabase
        .from("dhikr_contributions")
        .insert([
          {
            element_id: id,
            name: newName.trim(),
            amount: Number(newAmount),
          },
        ])
        .select()
        .single()

      if (error) {
        console.error(error)
        setSaving(false)
        return
      }

      setContributions((prev) => [
        ...prev,
        data,
      ])
    }

    setNewName("")
    setNewAmount("")

    setSaving(false)
  }

  async function checkDhikrCompletion(
    totalAmount: number
  ) {

    if (!event) return

    const { data: element } = await supabase
      .from("elements")
      .select("status, completed_at")
      .eq("id", id)
      .single()

    const alreadyCompleted =
      element?.status === "completed"

    if (
      totalAmount >= event.target &&
      !alreadyCompleted
    ) {

      await supabase
        .from("elements")
        .update({
          status: "completed",
          completed_at:
            new Date().toISOString(),
        })
        .eq("id", id)
    }
  }

  /* Total */
  const total = contributions.reduce(
    (sum, item) => sum + item.amount,
    0
  )

  useEffect(() => {
    checkDhikrCompletion(total)
  }, [contributions])

  if (!event) {

    return (
      <main className="min-h-screen bg-[#070B14] flex items-center justify-center text-white">

        <div className="text-center">

          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto mb-4"></div>

          <p className="text-gray-300">
            Loading...
          </p>

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
        onClick={() => {
          router.back()

          setTimeout(() => {
            router.refresh()
          }, 100)
        }}
        className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white transition border border-gray-700"
      >
        Back
      </button>

      {/* Done */}
      <button
        onClick={() => {

          setLeaving(true)

          router.push("/")

          setTimeout(() => {
            router.refresh()
          }, 100)
        }}
        disabled={leaving}
        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-70 transition text-white font-medium"
      >
        {leaving ? "Saving..." : "Done"}
      </button>

    </div>

      {/* Header */}
      <div className="mb-8 mt-4">

        <h1 className="text-2xl font-bold">
          {event.title}
        </h1>

        <p className="text-gray-400 mt-1">
          {event.dhikr_text}
        </p>

        <p className="text-green-400 mt-3 text-lg">
          {total.toLocaleString()} /{" "}
          {event.target.toLocaleString()}
        </p>

      </div>

      {/* Leaderboard */}
      <div className="space-y-3 mb-8">

        {contributions.length === 0 ? (

          <p className="text-gray-400">
            No contributions yet.
          </p>

        ) : (

          [...contributions]
            .sort((a, b) => b.amount - a.amount)
            .map((entry) => (

              <div
                key={entry.id}
                className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4 flex gap-3 items-center"
              >

                {/* Editable Name */}
                <input
                  type="text"
                  value={entry.name}
                  onChange={(e) => {

                    const updated =
                      contributions.map((c) =>
                        c.id === entry.id
                          ? {
                              ...c,
                              name:
                                e.target.value,
                            }
                          : c
                      )

                    setContributions(updated)
                  }}
                  onBlur={async (e) => {

                    await supabase
                      .from(
                        "dhikr_contributions"
                      )
                      .update({
                        name:
                          e.target.value,
                      })
                      .eq("id", entry.id)
                  }}
                  className="flex-1 bg-[#1F2937] rounded-xl p-2 text-white"
                />

                {/* Editable Amount */}
                <input
                  type="number"
                  value={entry.amount}
                  onChange={(e) => {

                    const updated =
                      contributions.map((c) =>
                        c.id === entry.id
                          ? {
                              ...c,
                              amount: Number(
                                e.target.value
                              ),
                            }
                          : c
                      )

                    setContributions(updated)
                  }}
                  onBlur={async (e) => {

                    const newAmount =
                      Number(e.target.value)

                    await supabase
                      .from(
                        "dhikr_contributions"
                      )
                      .update({
                        amount:
                          newAmount,
                      })
                      .eq("id", entry.id)

                    const updatedTotal =
                      contributions.reduce(
                        (sum, item) =>
                          item.id ===
                          entry.id
                            ? sum +
                              newAmount
                            : sum +
                              item.amount,
                        0
                      )

                    checkDhikrCompletion(
                      updatedTotal
                    )
                  }}
                  className="w-28 bg-[#1F2937] rounded-xl p-2 text-green-400 text-right"
                />

              </div>
            ))
        )}

      </div>

      {/* Add Contribution */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4">

        <h2 className="font-semibold mb-4">
          Add Contribution
        </h2>

        {/* Name */}
        <input
          type="text"
          placeholder="Name"
          value={newName}
          onChange={(e) =>
            setNewName(e.target.value)
          }
          className="w-full p-3 mb-3 rounded-xl bg-[#1F2937] text-white"
        />

        {/* Amount */}
        <input
          type="number"
          placeholder="Amount"
          value={newAmount}
          onChange={(e) =>
            setNewAmount(e.target.value)
          }
          className="w-full p-3 mb-4 rounded-xl bg-[#1F2937] text-white"
        />

        {/* Button */}
        <button
          onClick={addContribution}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-500 transition py-3 rounded-xl"
        >
          {saving
            ? "Adding..."
            : "Add Contribution"}
        </button>

      </div>

      {/* Done */}
      <div className="mt-10">

        <button
          onClick={() => {

            setLeaving(true)

            router.push("/")

            setTimeout(() => {
              router.refresh()
            }, 100)
          }}
          disabled={leaving}
          className="w-full bg-green-600 hover:bg-green-500 transition py-3 rounded-xl font-semibold disabled:opacity-70"
        >
          {leaving ? "Saving..." : "Done"}
        </button>

      </div>

    </main>
  )
}