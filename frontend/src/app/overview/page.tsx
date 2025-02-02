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
  const [sortConfig, setSortConfig] = useState<{ key: keyof FE; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc",
  });

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

  const sortData = (key: keyof FE) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });

    const sortedData = [...FE].sort((a, b) => {
      if (key === "name" || key === "status" || key === "status_note" || key === "installed_version") {
        const aValue = a[key].toLowerCase();
        const bValue = b[key].toLowerCase();
        return direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else if (key === "ip_address") {
        const aValue = a[key].split(".").map(Number);
        const bValue = b[key].split(".").map(Number);
        return direction === "asc" ? compareIP(aValue, bValue) : compareIP(bValue, aValue);
      } //else if (key === "installed_version") {
        //const aValue = a[key].split("-").map(Number);
        //const bValue = b[key].split("-").map(Number);
        //return direction === "asc" ? compareVersion(aValue, bValue) : compareVersion(bValue, aValue);
      //}
      return 0;
    });

    setFE(sortedData);
  };

  const compareIP = (a: number[], b: number[]) => {
    for (let i = 0; i < 4; i++) {
      if (a[i] !== b[i]) {
        return a[i] - b[i];
      }
    }
    return 0;
  };

  const compareVersion = (a: number[], b: number[]) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        return a[i] - b[i];
      }
    }
    return a.length - b.length;
  };

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
                <th className="p-3 border">Nr.</th>
                <th className="p-3 border cursor-pointer" onClick={() => sortData("name")}>
                  Name
                </th>
                <th className="p-3 border cursor-pointer" onClick={() => sortData("ip_address")}>
                  IP-Adresse
                </th>
                <th className="p-3 border cursor-pointer" onClick={() => sortData("status")}>
                  Status
                </th>
                <th className="p-3 border cursor-pointer" onClick={() => sortData("status_note")}>
                  Status Bemerkung
                </th>
                <th className="p-3 border cursor-pointer" onClick={() => sortData("installed_version")}>
                  Installed Version
                </th>
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
                  <td className="p-3 border">{index + 1}</td>
                  <td className="p-3 border">{fe.name}</td>
                  <td className="p-3 border">{fe.ip_address}</td>
                  <td
                    className={`p-3 border font-semibold ${
                      fe.status === "Testbereit"
                        ? "text-green-600"
                        : fe.status === "Reserviert"
                        ? "text-red-600"
                        : fe.status === "Installation/Wartung"
                        ? "text-blue-600"
                        : fe.status === "AIS"
                        ? "text-orange-600"
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
