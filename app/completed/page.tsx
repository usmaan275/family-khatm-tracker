"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Element = {
    id: string
    title: string
    dhikr_text: string | null
    type: "quran" | "dhikr"
    target: number | null
    status: "active" | "completed"
    created_at: string
    completed_at: string | null
}

export default function CompletedPage() {

    const router = useRouter()

    const [events, setEvents] = useState<Element[]>([])
    const [loading, setLoading] = useState(true)

    const [search, setSearch] = useState("")

    const [sort, setSort] = useState("completed_desc")

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {

        const { data } = await supabase
            .from("elements")
            .select("*")
            .eq("status", "completed")

        setEvents(data || [])

        setLoading(false)
    }

    const filtered = useMemo(() => {

        let items = [...events]

        if (search.trim()) {

            const q = search.toLowerCase()

            items = items.filter(
                (e) =>
                    e.title.toLowerCase().includes(q) ||
                    e.dhikr_text?.toLowerCase().includes(q)
            )
        }

        switch (sort) {

            case "completed_desc":
                items.sort(
                    (a, b) =>
                        new Date(b.completed_at || "").getTime() -
                        new Date(a.completed_at || "").getTime()
                )
                break

            case "completed_asc":
                items.sort(
                    (a, b) =>
                        new Date(a.completed_at || "").getTime() -
                        new Date(b.completed_at || "").getTime()
                )
                break

            case "created_desc":
                items.sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                )
                break

            case "created_asc":
                items.sort(
                    (a, b) =>
                        new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime()
                )
                break
        }

        return items

    }, [events, search, sort])

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
                onClick={() => {
                    router.back()
                }}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white transition border border-gray-700 mb-4"
            >
                Back
            </button>

            <h1 className="text-2xl font-bold mb-6">
                Completed Khatms ({filtered.length})
            </h1>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">

                <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    className="
                        flex-1
                        bg-[#111827]
                        border border-[#1F2937]
                        rounded-xl
                        px-4 py-3
                        outline-none
                        focus:border-green-500
                    "
                />

                <select
                    value={sort}
                    onChange={(e) =>
                        setSort(e.target.value)
                    }
                    className="
                        bg-[#111827]
                        border border-[#1F2937]
                        rounded-xl
                        px-4 py-3
                        outline-none
                        focus:border-green-500
                    "
                >
                    <option value="completed_desc">
                        Newest Completed
                    </option>

                    <option value="completed_asc">
                        Oldest Completed
                    </option>

                    <option value="created_desc">
                        Newest Created
                    </option>

                    <option value="created_asc">
                        Oldest Created
                    </option>
                </select>

            </div>

            {/* List */}
            <div className="space-y-4">

                {filtered.map((item) => (

                    <div
                        key={item.id}
                        className="
                            p-4
                            bg-[#111827]
                            border border-[#1F2937]
                            rounded-2xl
                            opacity-70
                            hover:border-green-600
                            transition-all duration-300
                        "
                    >

                        <div className="flex justify-between items-start">

                            <Link
                                href={
                                    item.type === "quran"
                                        ? `/quran/${item.id}`
                                        : `/dhikr/${item.id}`
                                }
                                className="flex-1"
                            >
                                <h3 className="font-semibold text-lg">
                                    {item.title}
                                </h3>
                            </Link>

                            <Link
                                href={`/edit/${item.id}`}
                                className="
                                    px-3 py-2
                                    rounded-lg
                                    bg-green-600
                                    hover:bg-green-500
                                    transition
                                    text-xs
                                    font-semibold
                                    ml-3
                                "
                            >
                                Edit
                            </Link>

                        </div>

                        <Link
                            href={
                                item.type === "quran"
                                    ? `/quran/${item.id}`
                                    : `/dhikr/${item.id}`
                            }
                        >

                            <p className="text-sm text-gray-400 mt-1">
                                {item.type === "quran"
                                    ? "Quran Khatm"
                                    : item.dhikr_text}
                            </p>

                            <p className="text-xs mt-3 text-gray-500">
                                Created:{" "}
                                {new Date(item.created_at).toLocaleString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric"
                                })}
                            </p>

                            <p className="text-xs mt-3 text-gray-500">
                                Completed:{" "}
                                {item.completed_at
                                    ? new Date(item.completed_at).toLocaleString("en-GB", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric"
                                    })
                                    : "—"}
                            </p>

                        </Link>

                    </div>
                ))}

            </div>

        </main>
    )
}