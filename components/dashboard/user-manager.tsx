"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    fetch("http://localhost:5000/api/users", {
      headers: {
        Authorization: token ? `Bearer ${token}` : ""
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setUsers(data.data);
        } else {
          setError("Failed to load users");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Error fetching users");
        setLoading(false);
      });
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const token = localStorage.getItem("accessToken");
    fetch(`http://localhost:5000/api/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: token ? `Bearer ${token}` : ""
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers((prev) => prev.filter((u) => u._id !== id));
        } else {
          alert("Failed to delete user");
        }
      })
      .catch(() => alert("Error deleting user"));
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">User Manager</h2>
      <table className="w-full border mb-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Role</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td className="p-2">{user.firstName} {user.lastName}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.role}</td>
              <td className="p-2">
                <Button variant="destructive" size="sm" onClick={() => handleDelete(user._id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
