// frontend/src/app/Register.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";    

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    console.log("handleRegister was called!");
    try{
      const response = await fetch("http://localhost:8080/api/register.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const responseText = await response.text(); // Hol die rohe Antwort
      console.log("Rohes API-Response:", responseText);

      //const data = await response.json();
      const data = JSON.parse(responseText); // Versuche, es als JSON zu parsen
      console.log("Geparstes API-Response:", data);

      if (data.success) {
        alert("Registrierung erfolgreich!");
        router.push("/login");
      } else {
        setError(data.error);
      }
    } catch (error) 
    {
      console.error("Error:", error);
      setError("Serverfehler!");
    }
  };

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">Register</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2"
          />
        </label>
      </div>
      <div>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2"
          />
        </label>
      </div>
      <button onClick={handleRegister} className="mt-4 p-2 bg-blue-500 text-white">
        Register
      </button>
    </main>
  );
}
