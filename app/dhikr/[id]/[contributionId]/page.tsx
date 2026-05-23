"use client"

import {
  use,
  useEffect,
  useMemo,
  useState,
} from "react"

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

export default function TasbihPage({
  params,
}: {
  params: Promise<{
    id: string
    contributionId: string
  }>
}) {

  const router = useRouter()

  const {
    id,
    contributionId,
  } = use(params)

  const [event, setEvent] =
    useState<ElementData | null>(null)

  const [contribution, setContribution] =
    useState<Contribution | null>(null)

  const [allContributions, setAllContributions] =
    useState<Contribution[]>([])

  const [showDeleteModal, setShowDeleteModal] =
    useState(false)

  const [leaving, setLeaving] =
    useState(false)

  const [counterSize, setCounterSize] =
    useState(320)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {

    function updateSize() {

      const width =
        window.innerWidth * 0.92

      const height =
        (window.innerHeight - 260) * 0.95

      setCounterSize(
        Math.min(width, height)
      )
    }

    updateSize()

    window.addEventListener(
      "resize",
      updateSize
    )

    return () =>
      window.removeEventListener(
        "resize",
        updateSize
      )

  }, [])

  async function fetchData() {

    /* Event */
    const { data: eventData } = await supabase
      .from("elements")
      .select("*")
      .eq("id", id)
      .single()

    setEvent(eventData)

    /* All contributions */
    const { data: contributionsData } =
      await supabase
        .from("dhikr_contributions")
        .select("*")
        .eq("element_id", id)

    setAllContributions(
      contributionsData || []
    )

    /* Current contribution */
    const current =
      contributionsData?.find(
        (c) => c.id === contributionId
      ) || null

    setContribution(current)
  }

  async function incrementTasbih() {

    if (!contribution) return

    const newAmount =
      contribution.amount + 1

    /* Instant local update */
    setContribution({
      ...contribution,
      amount: newAmount,
    })

    setAllContributions((prev) =>
      prev.map((c) =>
        c.id === contribution.id
          ? {
              ...c,
              amount: newAmount,
            }
          : c
      )
    )

    /* DB update */
    await supabase
      .from("dhikr_contributions")
      .update({
        amount: newAmount,
      })
      .eq("id", contribution.id)

    checkDhikrCompletion(
      totalWithoutCurrent +
      newAmount
    )
  }

  async function updateName(
    value: string
  ) {

    if (!contribution) return

    setContribution({
      ...contribution,
      name: value,
    })

    await supabase
      .from("dhikr_contributions")
      .update({
        name: value,
      })
      .eq("id", contribution.id)
  }

  async function updateAmount(
    value: number
  ) {

    if (!contribution) return

    setContribution({
      ...contribution,
      amount: value,
    })

    setAllContributions((prev) =>
      prev.map((c) =>
        c.id === contribution.id
          ? {
              ...c,
              amount: value,
            }
          : c
      )
    )

    await supabase
      .from("dhikr_contributions")
      .update({
        amount: value,
      })
      .eq("id", contribution.id)

    checkDhikrCompletion(
      totalWithoutCurrent +
      value
    )
  }

  async function deleteContribution() {

    if (!contribution) return

    await supabase
      .from("dhikr_contributions")
      .delete()
      .eq("id", contribution.id)

    setLeaving(true)

    router.push(`/dhikr/${id}`)

    setTimeout(() => {
      router.refresh()
    }, 100)
  }

  async function checkDhikrCompletion(
    totalAmount: number
  ) {

    if (!event) return

    const { data: element } =
      await supabase
        .from("elements")
        .select("status")
        .eq("id", id)
        .single()

    const isCompleted =
      element?.status ===
      "completed"

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

    /* SHOULD REVERT */
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

  const total =
    allContributions.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    )

  const totalWithoutCurrent =
    allContributions.reduce(
      (sum, item) =>
        item.id === contributionId
          ? sum
          : sum + item.amount,
      0
    )

  if (!event || !contribution) {

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
    <main className="min-h-screen bg-[#070B14] text-white px-5 py-5 overflow-hidden">

      {/* Top Bar */}
      <div className="relative flex items-center justify-between mb-8 min-h-[44px]">

        {/* Back */}
        <button
          onClick={() => {

            setLeaving(true)

            router.push(`/dhikr/${id}`)

            setTimeout(() => {
              router.refresh()
            }, 100)
          }}
          disabled={leaving}
          className="z-10 px-4 py-2 rounded-xl bg-[#111827] border border-[#1F2937] hover:bg-[#1F2937] transition"
        >
          {leaving
            ? "Returning..."
            : "Back"}
        </button>

        {/* Center */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none max-w-[55%]">

          <h1 className="font-bold text-lg md:text-2xl truncate">
            {event.title}
          </h1>

          <p className="text-green-400 text-sm md:text-base mt-1">
            {total.toLocaleString()} /{" "}
            {event.target.toLocaleString()}
          </p>

        </div>

        {/* Delete */}
        <button
          onClick={() =>
            setShowDeleteModal(true)
          }
          className="z-10 px-4 py-2 rounded-xl bg-[#5B1C1C] hover:bg-[#6B2222] transition"
        >
          Delete
        </button>

      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-between h-100dvh">

        {/* Editable Info */}
        <div className="w-full max-w-2xl flex gap-3 mb-4">

          {/* Name */}
          <div className="flex-1">

            <p className="text-sm text-gray-400 mb-2">
              Name
            </p>

            <input
              type="text"
              value={contribution.name}
              onChange={(e) =>
                setContribution({
                  ...contribution,
                  name: e.target.value,
                })
              }
              onBlur={(e) =>
                updateName(
                  e.target.value
                )
              }
              className="
                w-full
                bg-[#111827]
                border border-[#1F2937]
                rounded-2xl
                px-4 py-4
                text-left
                text-lg
                outline-none
                focus:border-green-500
              "
            />

          </div>

          {/* Amount */}
          <div className="w-40">

            <p className="text-sm text-gray-400 mb-2">
              Amount
            </p>

            <input
              type="number"
              value={contribution.amount}
              onChange={(e) =>
                setContribution({
                  ...contribution,
                  amount: Number(
                    e.target.value
                  ),
                })
              }
              onBlur={(e) =>
                updateAmount(
                  Number(
                    e.target.value
                  )
                )
              }
              className="
                w-full
                bg-[#111827]
                border border-[#1F2937]
                rounded-2xl
                px-4 py-4
                text-left
                text-2xl
                font-bold
                text-green-400
                outline-none
                focus:border-green-500
              "
            />

          </div>

        </div>

        {/* Tasbih Counter */}
        <button
          onClick={incrementTasbih}
          style={{
            width: `${counterSize}px`,
            aspectRatio: "1 / 1",
          }}
          className="
            rounded-full
            bg-green-600
            active:scale-[0.98]
            transition
            shadow-2xl
            flex
            items-center
            justify-center
            select-none
            mt-4
            mb-6
            shrink-0
          "
        >

          <div className="text-center">

            <div className="text-7xl mb-3">
              📿
            </div>

            <div className="text-5xl font-bold">
              {contribution.amount.toLocaleString()}
            </div>

          </div>

        </button>

      </div>

      {/* Delete Modal */}
      {showDeleteModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center">

          {/* Overlay */}
          <div
            onClick={() =>
              setShowDeleteModal(false)
            }
            className="absolute inset-0 bg-black/60"
          />

          {/* Modal */}
          <div className="relative z-10 w-[90%] max-w-sm bg-[#111827] border border-[#1F2937] rounded-3xl p-6">

            <h2 className="text-xl font-bold mb-2 text-center">
              Delete Contribution?
            </h2>

            <p className="text-gray-400 text-center mb-6">
              This will remove the user
              from the leaderboard.
            </p>

            <div className="flex gap-3">

              {/* No */}
              <button
                onClick={() =>
                  setShowDeleteModal(false)
                }
                className="flex-1 py-3 rounded-2xl bg-[#1F2937] hover:bg-[#374151] transition font-semibold"
              >
                No
              </button>

              {/* Yes */}
              <button
                onClick={
                  deleteContribution
                }
                className="flex-1 py-3 rounded-2xl bg-red-700 hover:bg-red-600 transition font-semibold"
              >
                Yes
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  )
}