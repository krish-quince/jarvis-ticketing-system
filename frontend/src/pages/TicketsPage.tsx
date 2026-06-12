import { useEffect, useState } from "react";
import { getTickets } from "../services/ticketService";

const TicketsPage = () => {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await getTickets();

      console.log("Tickets:", data);

      setTickets(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Tickets</h2>

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
            <th>Ticket No</th>
            <th>Subject</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket: any) => (
            <tr key={ticket.ticket_id}>
              <td>{ticket.ticket_no}</td>
              <td>{ticket.subject}</td>
              <td>{ticket.status_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TicketsPage;