"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdvancedAnalytics() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/dashboard/analytics", {
      headers: {
        Authorization: localStorage.getItem("accessToken") ? `Bearer ${localStorage.getItem("accessToken")}` : ""
      }
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setData(res.data);
        } else {
          setError("Failed to load analytics data");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching analytics data");
        setLoading(false);
      });
  }, []);

  const handleExport = () => {
    const csv = [
      Object.keys(data[0] || {}).join(","),
      ...data.map(row => Object.values(row).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Advanced Analytics</h2>
      <Button onClick={handleExport} className="mb-4">Export CSV</Button>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            {data[0] && Object.keys(data[0]).map((key) => (
              <th key={key} className="p-2">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {Object.values(row).map((val, j) => (
                <td key={j} className="p-2">{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
