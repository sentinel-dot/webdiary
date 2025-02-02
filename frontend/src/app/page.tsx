"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-4">Willkommen im WebDiary</h1>
        <p className="text-gray-600 mb-6">
          Bitte loggen Sie sich ein oder registrieren Sie sich, um fortzufahren.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
          >
            Login
          </button>
          <button
            onClick={() => router.push("/register")}
            className="px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-400 transition"
          >
            Registrieren
          </button>
        </div>
      </div>
    </main>
  );
}
