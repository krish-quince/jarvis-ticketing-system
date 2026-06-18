import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../services/userService";

const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();

    if (Number(user.role_id) !== 1) {
      navigate("/tickets");
      return;
    }

    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ color: "var(--text-h)" }}>
      <h2 style={{ marginBottom: "20px" }}>Administration: Users List</h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "var(--bg-header)", borderBottom: "2px solid var(--border)" }}>
            <th style={{ padding: "12px", textAlign: "left", color: "var(--text-h)", fontWeight: 600 }}>User Code</th>
            <th style={{ padding: "12px", textAlign: "left", color: "var(--text-h)", fontWeight: 600 }}>Name</th>
            <th style={{ padding: "12px", textAlign: "left", color: "var(--text-h)", fontWeight: 600 }}>Email</th>
            <th style={{ padding: "12px", textAlign: "left", color: "var(--text-h)", fontWeight: 600 }}>Role</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user: any) => (
            <tr key={user.user_code} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "12px", color: "var(--text)" }}>{user.user_code}</td>
              <td style={{ padding: "12px", color: "var(--text-h)", fontWeight: 600 }}>
                {user.first_name} {user.last_name}
              </td>
              <td style={{ padding: "12px", color: "var(--text)" }}>{user.email}</td>
              <td style={{ padding: "12px", color: "var(--text)" }}>{user.role_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersPage;