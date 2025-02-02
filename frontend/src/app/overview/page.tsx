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
      }
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
    <main className="p-4">
<div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Testrechner Übersicht</h1>
        <div className="flex gap-4">
          {/* Dropdown 1 */}
          <div className="relative group">
            <button className="p-2 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-400 transition">
              Dropdown 1
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100">Dummy Button 1</button>
              <button className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100">Dummy Button 2</button>
              <button className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100">Dummy Button 3</button>
            </div>
          </div>

          {/* Dropdown 2 */}
          <div className="relative group">
            <button className="p-2 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-400 transition">
              Dropdown 2
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100">Dummy Button 1</button>
              <button className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100">Dummy Button 2</button>
            </div>
          </div>

          {/* Dropdown 3 */}
          <div className="relative group">
            <button className="p-2 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-400 transition">
              Dropdown 3
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100">Dummy Button 1</button>
            </div>
          </div>
        </div>
      </div>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border p-2 cursor-pointer" onClick={() => sortData("name")}>Name</th>
            <th className="border p-2 cursor-pointer" onClick={() => sortData("ip_address")}>IP</th>
            <th className="border p-2 cursor-pointer" onClick={() => sortData("status")}>Status</th>
            <th className="border p-2 cursor-pointer" onClick={() => sortData("status_note")}>Bemerkung</th>
            <th className="border p-2 cursor-pointer" onClick={() => sortData("installed_version")}>Version</th>
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
    </main>
  );
}







