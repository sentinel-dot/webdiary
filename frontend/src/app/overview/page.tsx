"use client";

import { useEffect, useState } from "react";

interface FE {
  id: number;
  name: string;
  ip_address: string;
  status: string;
  status_note: string;
  installed_version: string;
}

export default function Uebersicht() {
  const [FE, setFE] = useState<FE[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8080/api/get_FEs.php") // API-URL anpassen
      .then((res) => {
        if (!res.ok) {
          throw new Error("Netzwerkantwort war nicht ok");
        }
        return res.json();
      })
      .then((data) => setFE(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Testrechner Übersicht</h1>

      {loading ? (
        <p className="text-gray-500">Lade Daten...</p>
      ) : error ? (
        <p className="text-red-500">Fehler: {error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200 text-gray-700 text-left">
                <th className="p-3 border">Name</th>
                <th className="p-3 border">IP-Adresse</th>
                <th className="p-3 border">Status</th>
                <th className="p-3 border">Bemerkung</th>
                <th className="p-3 border">Version</th>
              </tr>
            </thead>
            <tbody>
              {FE.map((fe, index) => (
                <tr
                  key={fe.id}
                  className={`border ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-gray-100 transition`}
                >
                  <td className="p-3 border">{fe.name}</td>
                  <td className="p-3 border">{fe.ip_address}</td>
                  <td
                    className={`p-3 border font-semibold ${
                      fe.status === "Testbereit"
                        ? "text-green-600"
                        : fe.status === "Reserviert"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {fe.status}
                  </td>
                  <td className="p-3 border text-gray-700">{fe.status_note}</td>
                  <td className="p-3 border text-gray-700">{fe.installed_version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
