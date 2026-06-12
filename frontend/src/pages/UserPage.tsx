import { useEffect, useState } from "react";
import { getUsers } from "../services/userService";

const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      console.log("Users:", data);
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Users</h2>

      <table
        border={1}
        cellPadding={10}
        style={{
          width: "100%",
          background: "#fff",
        }}
      >
        <thead>
          <tr>
            <th>User Code</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user: any) => (
            <tr key={user.user_code}>
              <td>{user.user_code}</td>
              <td>
                {user.first_name}{" "}
                {user.last_name}
              </td>
              <td>{user.email}</td>
              <td>{user.role_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersPage;