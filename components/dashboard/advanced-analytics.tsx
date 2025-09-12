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
        console.log("Analytics API response:", res);
        // Pick the array you want to display, e.g. usersByRegion
        const analyticsArray = Array.isArray(res.data.usersByRegion) ? res.data.usersByRegion : [];
        if (res.success && analyticsArray.length > 0) {
          setData(analyticsArray);
        } else {
          setError("No analytics data available.");
        }
        setLoading(false);
      })
      .catch((e) => {
        setError("Error fetching analytics data");
        setLoading(false);
      });
  }, []);

  const handleExport = () => {
    if (!data.length) return;
    const csv = [
      Object.keys(data[0]).join(","),
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
      {data.length > 0 ? (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              {Object.keys(data[0]).map((key) => (
                <th key={key} className="p-2">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((val, j) => (
                  <td key={j} className="p-2">{String(val)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>No analytics data available.</div>
      )}
    </div>
  );
}
