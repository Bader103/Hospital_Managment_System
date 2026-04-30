import React, { useMemo, useState, useEffect } from "react";
import { Search, Calendar, BadgeIndianRupee } from "lucide-react";
import {
  pageStyles,
  statusClasses,
  keyframesStyles,
} from "../../assets/dummyStyles";

const API_BASE = "http://localhost:4000";

/* ---------------------- Helpers ---------------------- */
function formatDateISO(iso) {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function dateTimeFromSlot(slot) {
  try {
    if (!slot?.date) return new Date(0);

    const [y, m, d] = slot.date.split("-");
    const base = new Date(Number(y), Number(m) - 1, Number(d));

    if (slot.time) {
      const [time, ampm] = slot.time.split(" ");
      let [hh, mm] = time.split(":").map(Number);

      if (ampm === "PM" && hh !== 12) hh += 12;
      if (ampm === "AM" && hh === 12) hh = 0;

      base.setHours(hh, mm);
    }

    return base;
  } catch {
    return new Date(0);
  }
}

/* ---------------------- Component ---------------------- */
export default function AppointmentsPage() {
  const isAdmin = true;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterSpeciality, setFilterSpeciality] = useState("all");
  const [showAll, setShowAll] = useState(false);

  /* ---------------------- Fetch ---------------------- */
  async function fetchAppointments() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/appointments?limit=200`);
      const body = await res.json().catch(() => null);

      let list = [];

      // ✅ support multiple API formats
      if (Array.isArray(body)) {
        list = body;
      } else if (Array.isArray(body?.appointments)) {
        list = body.appointments;
      } else if (Array.isArray(body?.data)) {
        list = body.data;
      }

      const items = list.map((a) => ({
        id: a._id || a.id,
        patientName: a.patientName || "Unknown",
        age: a.age || "",
        gender: a.gender || "",
        mobile: a.mobile || "",
        doctorName:
          (a.doctorId && a.doctorId.name) || a.doctorName || "Unknown",
        speciality:
          (a.doctorId && a.doctorId.specialization) ||
          a.speciality ||
          a.specialization ||
          "General",
        fee: typeof a.fees === "number" ? a.fees : a.fee || 0,
        slot: {
          date: a.date || a.slot?.date || "",
          time: a.time || a.slot?.time || "",
        },
        status: a.status || a.payment?.status || "Pending",
        raw: a,
      }));

      setAppointments(items);
    } catch (err) {
      console.error(err);
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  /* ---------------------- Filters ---------------------- */
  const specialities = useMemo(() => {
    const set = new Set(appointments.map((a) => a.speciality));
    return ["all", ...Array.from(set)];
  }, [appointments]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();

    return appointments.filter((a) => {
      if (
        filterSpeciality !== "all" &&
        a.speciality.toLowerCase() !== filterSpeciality.toLowerCase()
      )
        return false;

      if (filterDate && a.slot.date !== filterDate) return false;

      if (!q) return true;

      return (
        a.doctorName.toLowerCase().includes(q) ||
        a.patientName.toLowerCase().includes(q) ||
        a.mobile.includes(q)
      );
    });
  }, [appointments, query, filterDate, filterSpeciality]);

  const sortedFiltered = useMemo(() => {
    return filtered
      .slice()
      .sort(
        (a, b) =>
          dateTimeFromSlot(b.slot).getTime() -
          dateTimeFromSlot(a.slot).getTime()
      );
  }, [filtered]);

  const displayed = showAll
    ? sortedFiltered
    : sortedFiltered.slice(0, 8);

  /* ---------------------- Cancel ---------------------- */
  async function adminCancelAppointment(id) {
    const appt = appointments.find((x) => x.id === id);
    if (!appt) return;

    const status = appt.status.toLowerCase();
    if (status === "completed" || status === "canceled") return;

    if (!window.confirm("Cancel this appointment?")) return;

    try {
      // optimistic update
      setAppointments((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: "Canceled" } : p
        )
      );

      const res = await fetch(
        `${API_BASE}/api/appointments/${id}/cancel`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error("Cancel failed");

      // refresh from server
      fetchAppointments();
    } catch (err) {
      console.error(err);
      setError("Cancel failed");
      fetchAppointments(); // revert
    }
  }

  /* ---------------------- UI ---------------------- */
  return (
    <div className={pageStyles.container}>
      <style>{keyframesStyles}</style>

      <div className={pageStyles.maxWidthContainer}>
        <h1 className={pageStyles.headerTitle}>Appointments</h1>

        {/* Filters */}
        <div className={pageStyles.searchContainer}>
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
          />
        </div>

        {/* States */}
        {loading && <div>Loading...</div>}
        {error && <div className={pageStyles.errorContainer}>{error}</div>}

        {/* List */}
        {!loading && !error && (
          <div className={pageStyles.gridContainer}>
            {displayed.map((a) => {
              const disabled =
                ["completed", "canceled"].includes(
                  a.status.toLowerCase()
                );

              return (
                <div key={a.id} className={pageStyles.card}>
                  <h3>{a.patientName}</h3>
                  <p>{a.doctorName}</p>

                  <div>
                    <Calendar size={14} />
                    {formatDateISO(a.slot.date)} — {a.slot.time}
                  </div>

                  <div>
                    <BadgeIndianRupee /> {a.fee}
                  </div>

                  <div className={statusClasses(a.status)}>
                    {a.status}
                  </div>

                  {isAdmin && (
                    <button
                      disabled={disabled}
                      onClick={() =>
                        adminCancelAppointment(a.id)
                      }
                    >
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Show More */}
        {sortedFiltered.length > 8 && (
          <button onClick={() => setShowAll(!showAll)}>
            {showAll ? "Show Less" : "Show More"}
          </button>
        )}
      </div>
    </div>
  );
}