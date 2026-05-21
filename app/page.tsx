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
  const completed = events?.filter((e) => e.status === "completed") || []

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
          Active
        </h2>

        {active.length === 0 ? (

          <p className="text-gray-400">
            No active khatms yet.
          </p>

        ) : (

          <div className="space-y-4">

            {active.map((item) => (

              <Link
                key={item.id}
                href={
                  item.type === "quran"
                    ? `/quran/${item.id}`
                    : `/dhikr/${item.id}`
                }
              >

                <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-2xl shadow-lg hover:border-green-600 transition cursor-pointer">

                  <h3 className="font-semibold text-lg">
                    {item.title}
                  </h3>

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
                    Created{" "}
                    {new Date(item.created_at).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>

                </div>

              </Link>
            ))}

          </div>
        )}

      </section>

      {/* COMPLETED */}
      <section>

        <h2 className="text-lg font-semibold mb-3">
          Completed
        </h2>

        {completed.length === 0 ? (

          <p className="text-gray-400">
            No completed khatms yet.
          </p>

        ) : (

          <div className="space-y-4">

            {completed.map((item) => (

              <Link
                key={item.id}
                href={
                  item.type === "quran"
                    ? `/quran/${item.id}`
                    : `/dhikr/${item.id}`
                }
              >

                <div className="p-4 bg-[#111827] border border-[#1F2937] rounded-2xl opacity-70 cursor-pointer hover:border-green-600 transition">

                  <h3 className="font-semibold">
                    {item.title}
                  </h3>

                  <p className="text-xs mt-3 text-gray-500">
                    Created:{" "}
                    {new Date(item.created_at).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>

                  <p className="text-xs mt-3 text-gray-500">
                    Completed:{" "}
                    {item.completed_at
                      ? new Date(item.completed_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })
                      : "—"}
                  </p>

                </div>

              </Link>

            ))}

          </div>
        )}

      </section>

    </main>
  )
}