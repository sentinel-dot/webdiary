// src/app/page.tsx
"use client"; // Wichtig für interaktive Komponenten
import { useEffect, useState } from "react";
//import { useRouter } from "next/router";

interface FE {
  id: number;
  name: string;
  ip_address: string;
  status: string;
  status_note: string;
  installed_version: string;
}

export default function Home() {
  const [FE, setFE] = useState<FE[]>([]);
  //const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role");
    //if (!role) {
    //  router.push("/login");
    //} else {
      fetch("http://localhost:8080/api/get_FEs.php") // API-URL anpassen
        .then((res) => res.json())
        .then((data) => setFE(data))
        .catch((err) => console.error("Fehler beim Laden:", err));
    //}
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
          {FE.map((FE) => (
            <tr key={FE.id}>
              <td className="border p-2">{FE.name}</td>
              <td className="border p-2">{FE.ip_address}</td>
              <td className="border p-2">{FE.status}</td>
              <td className="border p-2">{FE.status_note}</td>
              <td className="border p-2">{FE.installed_version}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
