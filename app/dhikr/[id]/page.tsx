"use client"

import { use, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { arabicFont } from "@/lib/fonts"

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
  const [returning, setReturning] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

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
      .select("status")
      .eq("id", id)
      .single()

    const isCompleted =
      element?.status === "completed"

    /* SHOULD COMPLETE */
    if (
      totalAmount >= event.target &&
      !isCompleted
    ) {

      await supabase
        .from("elements")
        .update({
          status: "completed",
          completed_at:
            new Date().toISOString(),
        })
        .eq("id", id)

      return
    }

    /* SHOULD REVERT BACK TO ACTIVE */
    if (
      totalAmount < event.target &&
      isCompleted
    ) {

      await supabase
        .from("elements")
        .update({
          status: "active",
          completed_at: null,
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
    <main className="min-h-screen bg-[#070B14] bg-[radial-gradient(ellipse_70%_35%_at_50%_0%,rgba(22,163,74,0.12),transparent)] text-white px-5 py-6">

      <div className="mx-auto max-w-2xl">

      {/* Top Bar */}
      <div className="flex items-center justify-between">

        {/* Back */}
        <button
          onClick={() => {
            setReturning(true)
            router.push("/")
            setTimeout(() => router.refresh(), 100)
          }}
          disabled={returning}
          className="w-12 h-10 rounded-xl bg-[#111827] text-gray-200 hover:bg-[#1F2937] hover:text-white hover:border-gray-600 active:scale-95 disabled:opacity-70 transition border border-[#1F2937]"
        >
          {returning ? (
            "..."
          ) : (
            <i className="fa fa-home" aria-hidden="true"></i>
          )}
        </button>

        {/* Done */}
        <button
          onClick={() => {
            setLeaving(true)
            router.push("/")
            setTimeout(() => router.refresh(), 100)
          }}
          disabled={leaving}
          className="w-22 h-10 rounded-xl bg-green-600 hover:bg-green-500 active:scale-95 disabled:opacity-70 transition text-white font-medium shadow-md shadow-green-900/30"
        >
          {leaving ? "Saving..." : "Done"}
        </button>

      </div>

      {/* Header */}
      <div className="mb-8 mt-6 p-5 rounded-2xl bg-[#111827] border border-[#1F2937] shadow-lg shadow-black/30">

        <h1 className="text-2xl font-bold tracking-tight">
          {event.title}
        </h1>

        <p className={`text-gray-400 mt-2 text-2xl leading-loose ${arabicFont.className}`}>
          {event.dhikr_text}
        </p>

        <p className="text-green-400 mt-3 text-lg font-semibold">
          {total.toLocaleString()} /{" "}
          {event.target.toLocaleString()}
        </p>

        {/* Progress bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#1F2937]">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{
              width: `${Math.min(100, (total / event.target) * 100)}%`,
            }}
          />
        </div>

      </div>

      {/* Leaderboard */}
      <div className="space-y-3 mb-8">

        {contributions.length === 0 ? (

          <p className="text-gray-400">
            No contributions yet.
          </p>

        ) : (

          <AnimatePresence>
            {[...contributions]
              .sort((a, b) => {
                if (b.amount !== a.amount) {
                  return b.amount - a.amount
                }
              
                return a.name.localeCompare(b.name)
              })
              .map((entry) => {

                const isEditing = editingId === entry.id

                return (
                  <motion.div
                    key={entry.id}
                    layout={!isEditing}   // ✅ IMPORTANT: disable animation while typing
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      layout: {
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      },
                    }}
                    className="bg-[#111827] border border-[#1F2937] rounded-2xl p-3 flex items-center gap-3 shadow-md shadow-black/20"
                  >

                    {/* Name */}
                    <input
                      type="text"
                      value={entry.name}
                      onFocus={() => setEditingId(entry.id)}
                      onBlur={async (e) => {
                        setEditingId(null)

                        await supabase
                          .from("dhikr_contributions")
                          .update({
                            name: e.target.value,
                          })
                          .eq("id", entry.id)
                      }}
                      onChange={(e) => {
                        const updated =
                          contributions.map((c) =>
                            c.id === entry.id
                              ? { ...c, name: e.target.value }
                              : c
                          )
                        setContributions(updated)
                      }}
                      className="flex-[1.4] min-w-0 bg-[#1F2937] border border-transparent rounded-xl px-3 py-2.5 text-white outline-none focus:border-green-500 transition"
                    />

                    {/* Amount */}
                    <input
                      type="text"
                      inputMode="numeric"
                      value={entry.amount}
                      onFocus={() => setEditingId(entry.id)}
                      onBlur={async (e) => {
                        setEditingId(null)

                        const newAmount = Number(e.target.value.replace(/\D/g, ""))

                        await supabase
                          .from("dhikr_contributions")
                          .update({
                            amount: newAmount,
                          })
                          .eq("id", entry.id)

                        const updatedTotal =
                          contributions.reduce(
                            (sum, item) =>
                              item.id === entry.id
                                ? sum + newAmount
                                : sum + item.amount,
                            0
                          )

                        checkDhikrCompletion(updatedTotal)
                      }}
                      onChange={(e) => {
                        const updated =
                          contributions.map((c) =>
                            c.id === entry.id
                              ? { ...c, amount: Number(e.target.value.replace(/\D/g, "")) }
                              : c
                          )
                        setContributions(updated)
                      }}
                      className="w-24 bg-[#1F2937] border border-transparent rounded-xl px-3 py-2.5 text-green-400 font-semibold text-right outline-none focus:border-green-500 transition"
                    />

                    {/* Tasbih */}
                    <button
                      onClick={() =>
                        router.push(
                          `/dhikr/${id}/${entry.id}`
                        )
                      }
                      className="bg-green-600 hover:bg-green-500 active:scale-95 transition px-3 py-2.5 rounded-xl font-semibold whitespace-nowrap shadow-md shadow-green-900/30"
                    >
                      📿
                    </button>

                  </motion.div>
                )
              })}
          </AnimatePresence>
        )}

      </div>

      {/* Add Contribution */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-lg shadow-black/30">

        <h2 className="font-semibold text-lg mb-4">
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
          className="w-full p-3.5 mb-3 rounded-xl bg-[#1F2937] border border-transparent text-white placeholder-gray-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
        />

        {/* Amount */}
        <input
          type="text"
          inputMode="numeric"
          placeholder="Amount"
          value={newAmount}
          onChange={(e) =>
            setNewAmount(
              e.target.value.replace(/\D/g, "")
            )
          }
          onKeyDown={(e) => {
            if (["e", "E", "+", "-", "."].includes(e.key)) {
              e.preventDefault()
            }
          }}
          className="w-full p-3.5 mb-4 rounded-xl bg-[#1F2937] border border-transparent text-white placeholder-gray-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
        />

        {/* Buttons */}
        <div className="flex gap-3">

          {/* +1 */}
          <button
            onClick={() => {
              const current = Number(newAmount || 0)
              setNewAmount(String(current + 1))
            }}
            className="flex-1 bg-[#1F2937] hover:bg-[#374151] active:scale-[0.98] transition py-3 rounded-xl font-semibold"
          >
            +1
          </button>

          {/* Add */}
          <button
            onClick={addContribution}
            disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-500 active:scale-[0.98] transition py-3 rounded-xl font-semibold shadow-md shadow-green-900/30 disabled:opacity-70"
          >
            {saving ? "Adding..." : "Add"}
          </button>

        </div>

      </div>

      {/* Done */}
      <div className="mt-10">

        <button
          onClick={() => {
            setLeaving(true)
            router.push("/")
            setTimeout(() => router.refresh(), 100)
          }}
          disabled={leaving}
          className="w-full bg-green-600 hover:bg-green-500 active:scale-[0.99] transition py-3.5 rounded-xl font-semibold shadow-lg shadow-green-900/30 disabled:opacity-70"
        >
          {leaving ? "Saving..." : "Done"}
        </button>

      </div>

      </div>

    </main>
  )
}
