"use client"

import {
  use,
  useEffect,
  useMemo,
  useState,
} from "react"

import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
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
        window.innerWidth * 0.9

      const height =
        (window.innerHeight - 290) * 0.9

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

    useEffect(() => {
      const originalBody = document.body.style.cssText
      const originalHtml = document.documentElement.style.cssText
    
      document.body.style.cssText = "overflow:hidden; position:fixed; width:100%;"
      document.documentElement.style.cssText = "overflow:hidden; height:100%;"
    
      return () => {
        document.body.style.cssText = originalBody
        document.documentElement.style.cssText = originalHtml
      }
    }, [])

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
      <div className="relative flex items-center justify-between mb-6 min-h-[44px]">

        {/* 📊 */}
        <button
          onClick={() => {
            setLeaving(true)

            router.push(`/dhikr/${id}`)

            setTimeout(() => {
              router.refresh()
            }, 100)
          }}
          disabled={leaving}
          className="w-18 h-10 text-sm rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-70 transition text-white font-medium"
        >
          {leaving ? "..." : "📊"}
        </button>

        {/* Center */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none max-w-[60%]">
          <h1 className="font-semibold text-base md:text-lg truncate leading-tight">
            {event.title}
          </h1>

          <p className="text-green-400 text-xs md:text-sm mt-0.5">
            {total.toLocaleString()} / {event.target.toLocaleString()}
          </p>
        </div>

        {/* Delete */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-18 h-10 text-sm rounded-lg bg-[#5B1C1C] hover:bg-[#6B2222] transition text-white font-medium"
        >
          Delete
        </button>

      </div>

      {/* Content */}
      <div className="flex flex-col items-center min-h-[95dvh]">

        {/* Dhikr Text */}
        <div className="flex items-end">
          <div
            className={`
              w-full
              max-w-2xl
              mb-4
              bg-[#111827]
              border border-[#1F2937]
              rounded-2xl
              px-3 py-2
              text-center
              text-xl
              text-white
              leading-loose
              ${arabicFont.className}
            `}
          >
            {event?.dhikr_text}
          </div>
        </div>

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
            active:scale-[0.95]
            hover:scale-[1.02]
            transition-transform duration-400 ease-out
            shadow-[0_0_40px_rgba(34,197,94,0.3)]
            transition
            shadow-2xl
            flex
            items-center
            justify-center
            select-none
            mt-1
            mb-1
            shrink-0
            fixed bottom-2 left-1/2 -translate-x-1/2
            w-[min(320px,90vw)]
            aspect-square
          "
        >

          <div className="text-center">

            <div className="text-7xl mb-3">
              📿
            </div>

            <div className="text-5xl font-bold">
              +
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