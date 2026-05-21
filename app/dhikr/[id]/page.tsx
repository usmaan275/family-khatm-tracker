"use client"

import { use, useEffect, useRef, useState } from "react"
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

  const inputRef = useRef<HTMLInputElement>(null)

  const [event, setEvent] = useState<ElementData | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])

  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {

    const { data: eventData } = await supabase
      .from("elements")
      .select("*")
      .eq("id", id)
      .single()

    setEvent(eventData)

    const { data: contributionData } = await supabase
      .from("dhikr_contributions")
      .select("*")
      .eq("element_id", id)

    setContributions(contributionData || [])
  }

  async function addContribution() {

    if (!amount) return
    if (!name.trim()) return

    const { error } = await supabase
      .from("dhikr_contributions")
      .insert([
        {
          element_id: id,
          name: name.trim(),
          amount: Number(amount)
        }
      ])

    if (error) {
      console.error(error)
      return
    }

    setAmount("")
    fetchData()
  }

  async function checkDhikrCompletion(totalAmount: number) {

    if (!event) return

    if (totalAmount >= event.target) {

      await supabase
        .from("elements")
        .update({ status: "completed" })
        .eq("id", id)
    }
  }

  /* Leaderboard totals */
  const leaderboard: Record<string, number> = {}

  const uniqueNames = Array.from(
    new Set(contributions.map((c) => c.name))
  )

  contributions.forEach((entry) => {

    if (!leaderboard[entry.name]) {
      leaderboard[entry.name] = 0
    }

    leaderboard[entry.name] += entry.amount
  })

  const sortedLeaderboard = Object.entries(leaderboard)
    .sort((a, b) => b[1] - a[1])

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
          <p className="text-gray-300">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#070B14] text-white p-6">

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="text-gray-300 hover:text-white transition"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="mb-8">

        <h1 className="text-2xl font-bold">
          {event.title}
        </h1>

        <p className="text-gray-400 mt-1">
          {event.dhikr_text}
        </p>

        <p className="text-green-400 mt-3 text-lg">
          {total.toLocaleString()} / {event.target.toLocaleString()}
        </p>

      </div>

      {/* Leaderboard */}
      <div className="space-y-3 mb-8">

        {sortedLeaderboard.length === 0 ? (

          <p className="text-gray-400">
            No contributions yet.
          </p>

        ) : (

          sortedLeaderboard.map(([person, total]) => (

            <div
              key={person}
              className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4 flex justify-between"
            >

              <span>{person}</span>

              <span className="text-green-400">
                {total.toLocaleString()}
              </span>

            </div>
          ))
        )}

      </div>

      {/* Add Contribution */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-4">

        <h2 className="font-semibold mb-4">
          Add Amount
        </h2>

        {/* Name input */}
        <div className="relative mb-4">

          <input
            ref={inputRef}
            type="text"
            placeholder="Search or add name..."
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setShowDropdown(true)
            }}
            className="w-full p-3 rounded-xl bg-[#1F2937] text-white"
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
          />

          {/* Dropdown */}
          {showDropdown && name.length > 0 && (
            <div className="absolute w-full mt-2 bg-[#111827] border border-[#1F2937] rounded-xl max-h-40 overflow-y-auto z-10">

              {uniqueNames
                .filter((n) =>
                  n.toLowerCase().includes(name.toLowerCase())
                )
                .slice(0, 5)
                .map((n) => (
                  <div
                    key={n}
                    onClick={() => {
                      setName(n)
                      setShowDropdown(false)

                      setTimeout(() => {
                        inputRef.current?.blur()
                      }, 0)
                    }}
                    className="p-3 hover:bg-[#1F2937] cursor-pointer"
                  >
                    {n}
                  </div>
                ))}

              {/* Add new name */}
              {!uniqueNames.some(
                (n) => n.toLowerCase() === name.toLowerCase()
              ) && (
                <div
                  className="p-3 border-t border-[#1F2937] text-green-400 cursor-pointer"
                  onClick={() => {
                    setName(name)
                    setShowDropdown(false)

                    setTimeout(() => {
                      inputRef.current?.blur()
                    }, 0)
                  }}
                >
                  + Add "{name}"
                </div>
              )}

            </div>
          )}

        </div>

        {/* Amount */}
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 mb-4 rounded-xl bg-[#1F2937] text-white"
        />

        {/* Add button */}
        <button
          onClick={addContribution}
          className="w-full bg-green-600 hover:bg-green-500 transition py-3 rounded-xl"
        >
          Add Contribution
        </button>

      </div>

      {/* Done */}
      <div className="mt-10">
        <button
          onClick={() => {
            router.push("/")
            router.refresh()
          }}
          className="w-full bg-green-600 hover:bg-green-500 transition py-3 rounded-xl font-semibold"
        >
          Done
        </button>
      </div>

    </main>
  )
}