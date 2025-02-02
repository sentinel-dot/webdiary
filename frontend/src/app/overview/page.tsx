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

  useEffect(() => {
    fetch("http://localhost:8080/api/get_FEs.php") // API-URL anpassen
      .then((res) => res.json())
      .then((data) => setFE(data))
      .catch((err) => console.error("Fehler beim Laden:", err));
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Testrechner Übersicht</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">IP</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Bemerkung</th>
            <th className="border p-2">Version</th>
          </tr>
        </thead>
        <tbody>
          {FE.map((fe) => (
            <tr key={fe.id}>
              <td className="border p-2">{fe.name}</td>
              <td className="border p-2">{fe.ip_address}</td>
              <td className="border p-2">{fe.status}</td>
              <td className="border p-2">{fe.status_note}</td>
              <td className="border p-2">{fe.installed_version}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}