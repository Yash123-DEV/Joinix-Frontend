"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("https://joinix-backend1.onrender.com/api/auth/me",{
          credentials: "include",
        });

        if(res.ok) {
          const data = await res.json();
          console.log("User data:", data);
          router.push("/dashboard");
        }else {
          router.push("/sign-in");
        }
      }catch (error) {
        console.error("Error checking session:", error);
        router.push("/sign-up");
      }
    }
    checkSession();
  }, [router]);

  return (
    <div className="text-center mt-10">Checking login status...</div>
  );
}
