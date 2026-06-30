import { useState } from "react";
import api from "../api/client";
import AnalysisResult from "../components/AnalysisResult";
import LogInput from "../components/LogInput";

export default function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const investigate = async (payload) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await api.post("/api/investigate", payload);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Investigation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
      <LogInput onSubmit={investigate} loading={loading} error={error} />
      <AnalysisResult result={result} loading={loading} />
    </main>
  );
}
