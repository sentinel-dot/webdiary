"use client"; // Wichtig für interaktive Komponenten
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleNavigateToLogin = () => {
    router.push("/login");
  };

  const handleNavigateToRegister = () => {
    router.push("/register");
  }; 

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Willkommen im WebDiary</h1>
      <p>Dies ist die Landing Page. Bitte loggen Sie sich ein oder registrieren Sie sich, um fortzufahren.</p>
      <div className="mt-4">
        <button onClick={handleNavigateToLogin} className="mr-4 p-2 bg-blue-500 text-white">
          Login
        </button>
        <button onClick={handleNavigateToRegister} className="mr-4 p-2 bg-blue-500 text-white">
          Register
        </button>
      </div>
    </main>
  );
}
