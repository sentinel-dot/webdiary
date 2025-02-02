"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";    

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Login erfolgreich!");
        router.push("/overview");
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error("Fehler:", error);
      setError("Serverfehler!");
    }
  };

  const handleNavigateToRegister = () => 
    {
        router.push("/register");
    }

  return (
    <div>
      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" />
      <button onClick={handleLogin} className="mt-4 p-2 bg-blue-500 text-white">Login</button>
      <button onClick={handleNavigateToRegister} className="mt-4 p-2 bg-green-500 text-white">Register</button>
      {error && <p>{error}</p>}
    </div>
  );
};

export default Login;
