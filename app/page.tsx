import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { arabicFont } from "@/lib/fonts"
export const dynamic = "force-dynamic"

export default async function Home() {

  const { data: events, error } = await supabase
    .from("elements")
    .select("*")
    .order("created_at", { ascending: false })
    .throwOnError()

  const { data: quranData } = await supabase
    .from("quran_juz")
    .select("element_id, completed")

  const { data: dhikrData } = await supabase
    .from("dhikr_contributions")
    .select("element_id, amount")

  if (error) {
    console.error(error)
  }

  const active = events?.filter((e) => e.status === "active") || []
  const completed =
    events
      ?.filter((e) => e.status === "completed")
      .sort(
        (a, b) =>
          new Date(b.completed_at || "").getTime() -
          new Date(a.completed_at || "").getTime()
      ) || []

  const recentCompleted = completed.slice(0, 3)

  /* ----------------------------- */
  /* Helpers */
  /* ----------------------------- */

  function getQuranProgress(elementId: string) {
    const rows = quranData?.filter((q) => q.element_id === elementId) || []
    const done = rows.filter((r) => r.completed).length
    return done
  }

  function getDhikrTotal(elementId: string) {
    return (
      dhikrData
        ?.filter((d) => d.element_id === elementId)
        .reduce((sum, d) => sum + d.amount, 0) || 0
    )
  }

  /* Visual only: width of the progress bar */
  function getPercent(item: any) {
    if (item.type === "quran") {
      return Math.min(100, (getQuranProgress(item.id) / 30) * 100)
    }
    if (!item.target) return 0
    return Math.min(100, (getDhikrTotal(item.id) / item.target) * 100)
  }

  return (
    <main className="min-h-screen bg-[#070B14] bg-[radial-gradient(ellipse_70%_35%_at_50%_0%,rgba(22,163,74,0.12),transparent)] text-white px-5 py-8">

      <div className="mx-auto max-w-2xl">

      {/* Header */}
      <div className="flex justify-between items-center gap-4 mb-10">

        <h1 className="text-2xl font-bold tracking-tight leading-snug">
          Jomshed Miah Family Khatm Tracker
        </h1>

        <Link href="/create" className="shrink-0">
          <div className="w-11 h-11 flex items-center justify-center rounded-full bg-green-600 text-white text-2xl shadow-lg shadow-green-900/40 ring-1 ring-green-400/30 hover:bg-green-500 hover:scale-105 active:scale-95 transition">
            +
          </div>
        </Link>

      </div>

      {/* ACTIVE */}
      <section className="mb-12">

        <h2 className="text-lg font-semibold mb-4 text-gray-200">
          Active ({active.length})
        </h2>

        {active.length === 0 ? (

          <p className="text-gray-400">
            No active khatms yet.
          </p>

        ) : (

          <div className="space-y-4">

            {active.map((item) => (

              <div
                key={item.id}
                className="p-5 bg-[#111827] border border-[#1F2937] rounded-2xl shadow-lg shadow-black/30 hover:border-green-600 transition"
              >

                {/* TOP ROW: Title + Edit */}
                <div className="flex justify-between items-start">

                  {/* CLICKABLE CARD AREA */}
                  <Link
                    href={
                      item.type === "quran"
                        ? `/quran/${item.id}`
                        : `/dhikr/${item.id}`
                    }
                    className="flex-1"
                  >
                    <h3 className="font-semibold text-lg leading-snug">
                      {item.title}
                    </h3>
                  </Link>

                  {/* EDIT BUTTON (SEPARATE LINK) */}
                  <Link
                    href={`/edit/${item.id}`}
                    className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 active:scale-95 transition text-xs font-semibold ml-3 shadow-md shadow-green-900/30"
                  >
                    Edit
                  </Link>

                </div>

                {/* DESCRIPTION (still part of main link feel, optional clickable area) */}
                <Link
                  href={
                    item.type === "quran"
                      ? `/quran/${item.id}`
                      : `/dhikr/${item.id}`
                  }
                  className="block"
                >
                  <p
                    className={`mt-1 text-gray-400 ${
                      item.type === "quran"
                        ? "text-sm"
                        : `${arabicFont.className} text-xl leading-relaxed`
                    }`}
                  >
                    {item.type === "quran"
                      ? "Quran Khatm"
                      : item.dhikr_text}
                  </p>

                  {/* Quran Progress */}
                  {item.type === "quran" && (
                    <p className="text-sm mt-3 text-green-400 font-medium">
                      {getQuranProgress(item.id)} / 30 completed
                    </p>
                  )}

                  {/* Dhikr Progress */}
                  {item.type === "dhikr" && (
                    <p className="text-sm mt-3 text-green-400 font-medium">
                      {getDhikrTotal(item.id).toLocaleString()} /{" "}
                      {item.target?.toLocaleString()}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1F2937]">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${getPercent(item)}%` }}
                    />
                  </div>

                  <p className="text-xs mt-4 text-gray-500">
                    Created:{" "}
                    {new Date(item.created_at).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </Link>

              </div>

            ))}

          </div>
        )}

      </section>

      {/* COMPLETED */}
      <section>

        <h2 className="text-lg font-semibold mb-4 text-gray-200">
          Completed ({completed.length})
        </h2>

        {completed.length === 0 ? (

          <p className="text-gray-400">
            No completed khatms yet.
          </p>

        ) : (

          <div className="space-y-4">

            {recentCompleted.map((item) => (

              <div
                key={item.id}
                className="p-5 bg-[#111827] border border-[#1F2937] rounded-2xl opacity-70 hover:opacity-100 hover:border-green-600 transition"
              >

                {/* TOP ROW: Title + Edit */}
                <div className="flex justify-between items-start">

                  {/* MAIN CARD LINK */}
                  <Link
                    href={
                      item.type === "quran"
                        ? `/quran/${item.id}`
                        : `/dhikr/${item.id}`
                    }
                    className="flex-1"
                  >
                    <h3 className="font-semibold text-lg leading-snug">
                      {item.title}
                    </h3>
                  </Link>

                  {/* EDIT BUTTON (SEPARATE LINK) */}
                  <Link
                    href={`/edit/${item.id}`}
                    className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 active:scale-95 transition text-xs font-semibold ml-3 shadow-md shadow-green-900/30"
                  >
                    Edit
                  </Link>

                </div>

                {/* DESCRIPTION + PROGRESS (still clickable area) */}
                <Link
                  href={
                    item.type === "quran"
                      ? `/quran/${item.id}`
                      : `/dhikr/${item.id}`
                  }
                  className="block"
                >

                  <p
                    className={`mt-1 text-gray-400 ${
                      item.type === "quran"
                        ? "text-sm"
                        : `${arabicFont.className} text-xl leading-relaxed`
                    }`}
                  >
                    {item.type === "quran"
                      ? "Quran Khatm"
                      : item.dhikr_text}
                  </p>

                  {/* Quran Progress */}
                  {item.type === "quran" && (
                    <p className="text-sm mt-3 text-green-400 font-medium">
                      {getQuranProgress(item.id)} / 30 completed
                    </p>
                  )}

                  {/* Dhikr Progress */}
                  {item.type === "dhikr" && (
                    <p className="text-sm mt-3 text-green-400 font-medium">
                      {getDhikrTotal(item.id).toLocaleString()} /{" "}
                      {item.target?.toLocaleString()}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#1F2937]">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${getPercent(item)}%` }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
                    <p className="text-xs text-gray-500">
                      Created:{" "}
                      {new Date(item.created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </p>

                    <p className="text-xs text-gray-500">
                      Completed:{" "}
                      {item.completed_at
                        ? new Date(item.completed_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric"
                        })
                        : "—"}
                    </p>
                  </div>

                </Link>

              </div>

            ))}

            <div className="flex justify-center">
              {completed.length > 3 && (
                <Link
                  href="/completed"
                  className="
                    inline-flex
                    px-8 py-2.5
                    rounded-xl
                    bg-green-600
                    hover:bg-green-500
                    active:scale-95
                    transition
                    text-white
                    font-medium
                    shadow-lg shadow-green-900/30
                    mt-4
                  "
                >
                  View All
                </Link>
              )}
            </div>
          </div>
        )}

      </section>

      </div>

    </main>
  )
}
