import Link from "next/link"
import { supabase } from "@/lib/supabase"
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

  return (
    <main className="min-h-screen bg-[#070B14] text-white p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">

        <h1 className="text-2xl font-bold">
          Jomshed Miah Family Khatm Tracker
        </h1>

        <Link href="/create">
          <div className="w-11 h-11 flex items-center justify-center rounded-full bg-green-600 text-white text-2xl shadow-lg hover:scale-105 transition">
            +
          </div>
        </Link>

      </div>

      {/* ACTIVE */}
      <section className="mb-10">

        <h2 className="text-lg font-semibold mb-3">
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
                className="p-4 bg-[#111827] border border-[#1F2937] rounded-2xl shadow-lg hover:border-green-600 transition my-4"
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
                    <h3 className="font-semibold text-lg">
                      {item.title}
                    </h3>
                  </Link>

                  {/* EDIT BUTTON (SEPARATE LINK) */}
                  <Link
                    href={`/edit/${item.id}`}
                    className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 transition text-xs font-semibold ml-3"
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
                >
                  <p className="text-sm text-gray-400 mt-1">
                    {item.type === "quran"
                      ? "Quran Khatm"
                      : item.dhikr_text}
                  </p>

                  {/* Quran Progress */}
                  {item.type === "quran" && (
                    <p className="text-sm mt-2 text-green-400">
                      {getQuranProgress(item.id)} / 30 completed
                    </p>
                  )}

                  {/* Dhikr Progress */}
                  {item.type === "dhikr" && (
                    <p className="text-sm mt-2 text-green-400">
                      {getDhikrTotal(item.id).toLocaleString()} /{" "}
                      {item.target?.toLocaleString()}
                    </p>
                  )}

                  <p className="text-xs mt-3 text-gray-500">
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

        <h2 className="text-lg font-semibold mb-3">
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
                className="p-4 bg-[#111827] border border-[#1F2937] rounded-2xl opacity-70 hover:border-green-600 transition my-4"
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
                    <h3 className="font-semibold text-lg">
                      {item.title}
                    </h3>
                  </Link>

                  {/* EDIT BUTTON (SEPARATE LINK) */}
                  <Link
                    href={`/edit/${item.id}`}
                    className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 transition text-xs font-semibold ml-3"
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
                >

                  <p className="text-sm text-gray-400 mt-1">
                    {item.type === "quran"
                      ? "Quran Khatm"
                      : item.dhikr_text}
                  </p>

                  {/* Quran Progress */}
                  {item.type === "quran" && (
                    <p className="text-sm mt-2 text-green-400">
                      {getQuranProgress(item.id)} / 30 completed
                    </p>
                  )}

                  {/* Dhikr Progress */}
                  {item.type === "dhikr" && (
                    <p className="text-sm mt-2 text-green-400">
                      {getDhikrTotal(item.id).toLocaleString()} /{" "}
                      {item.target?.toLocaleString()}
                    </p>
                  )}

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

            <div className="flex justify-center">
              {completed.length > 3 && (
                <Link
                  href="/completed"
                    className="
                    inline-flex
                    px-8 py-2
                    rounded-lg
                    bg-green-600
                    hover:bg-green-500
                    transition
                    text-white
                    font-medium
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

    </main>
  )
}