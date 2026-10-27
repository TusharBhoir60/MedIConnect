"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useStore } from "@/lib/store";
import { tx } from "@/lib/i18n";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { lang } = useStore();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otp) return;
    await login(phone, otp);
    router.push("/asha");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50">
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg w-full md:w-1/2">
        <h1 className="text-2xl font-bold text-forest-950 mb-4">{tx("ashaLogin", lang)}</h1>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-4">
            <input
              type="text"
              placeholder={tx("phonePlaceholder", lang)}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border border-sand-200 rounded-md focus:ring-2 focus:ring-forest-500"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder={tx("otpPlaceholder", lang)}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-2 border border-sand-200 rounded-md focus:ring-2 focus:ring-forest-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-forest-800 text-white py-2 rounded-md hover:bg-forest-700 transition"
          >
            {tx("login", lang)}
          </button>
        </form>
      </div>
    </div>
  );
}
