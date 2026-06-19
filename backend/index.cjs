const http = require("http");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 5000);

const users = [
  {
    user_code: "USR-001",
    first_name: "Nandu",
    last_name: "Gatla",
    email: "admin@qyuince.com",
    role_id: "Admin",
    department: "IT",
  },
  {
    user_code: "USR-002",
    first_name: "Priya",
    last_name: "Menon",
    email: "priya@qyuince.com",
    role_id: "Agent",
    department: "Support",
  },
  {
    user_code: "USR-003",
    first_name: "Arjun",
    last_name: "Rao",
    email: "arjun@qyuince.com",
    role_id: "User",
    department: "Operations",
  },
];

const statuses = [
  { status_id: 1, status_name: "New", status_color: "#2196F3" },
  { status_id: 2, status_name: "In Progress", status_color: "#FD7E14" },
  { status_id: 3, status_name: "Closed", status_color: "#28A745" },
];

let tickets = [
  {
    ticket_id: 1,
    ticket_no: "TCK-1001",
    subject: "Unable to access trading dashboard",
    description: "User receives a blank page after login.",
    requester: "Arjun Rao",
    assignee: "Priya Menon",
    priority: "High",
    category: "Access",
    status_id: 1,
    status_name: "New",
    created_at: "2026-06-10T09:30:00.000Z",
    updated_at: "2026-06-10T09:30:00.000Z",
  },
  {
    ticket_id: 2,
    ticket_no: "TCK-1002",
    subject: "Password reset request",
    description: "Reset password for back-office portal.",
    requester: "Nandu Gatla",
    assignee: "Priya Menon",
    priority: "Medium",
    category: "Account",
    status_id: 2,
    status_name: "In Progress",
    created_at: "2026-06-11T05:00:00.000Z",
    updated_at: "2026-06-11T07:15:00.000Z",
  },
  {
    ticket_id: 3,
    ticket_no: "TCK-1003",
    subject: "Add new support mailbox routing",
    description: "Route incoming billing support emails to the helpdesk.",
    requester: "Priya Menon",
    assignee: "Nandu Gatla",
    priority: "Low",
    category: "Email",
    status_id: 3,
    status_name: "Closed",
    created_at: "2026-06-08T13:45:00.000Z",
    updated_at: "2026-06-09T10:20:00.000Z",
  },
  {
    ticket_id: 4,
    ticket_no: "TCK-1004",
    subject: "Broker file upload failing",
    description: "CSV upload stops at validation with no visible error.",
    requester: "Arjun Rao",
    assignee: "Priya Menon",
    priority: "Urgent",
    category: "Integrations",
    status_id: 1,
    status_name: "New",
    created_at: "2026-06-12T04:25:00.000Z",
    updated_at: "2026-06-12T04:25:00.000Z",
  },
];

const roles = ["Admin", "Agent", "User"];

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function getNextTicketId() {
  return tickets.reduce((max, ticket) => Math.max(max, ticket.ticket_id), 0) + 1;
}

function getDashboardSummary() {
  return {
    totalTickets: tickets.length,
    openTickets: tickets.filter((ticket) => ticket.status_name === "New").length,
    inProgressTickets: tickets.filter((ticket) => ticket.status_name === "In Progress").length,
    closedTickets: tickets.filter((ticket) => ticket.status_name === "Closed").length,
    urgentTickets: tickets.filter((ticket) => ticket.priority === "Urgent").length,
  };
}

function normalizeTicketPayload(payload, existingTicket = {}) {
  const now = new Date().toISOString();
  const ticketId = existingTicket.ticket_id || getNextTicketId();
  const status =
    statuses.find((item) => item.status_id === Number(payload.status_id)) ||
    statuses.find((item) => item.status_name === payload.status_name || item.status_name === payload.status) ||
    statuses.find((item) => item.status_id === Number(existingTicket.status_id)) ||
    statuses.find((item) => item.status_name === existingTicket.status_name) ||
    statuses[0];

  return {
    ticket_id: ticketId,
    ticket_no: existingTicket.ticket_no || `TCK-${1000 + ticketId}`,
    subject: payload.subject || existingTicket.subject || "New ticket",
    description: payload.description || existingTicket.description || "",
    requester: payload.requester || existingTicket.requester || "Portal User",
    assignee: payload.assignee || existingTicket.assignee || "Unassigned",
    priority: payload.priority || existingTicket.priority || "Medium",
    category: payload.category || existingTicket.category || "General",
    status_id: status.status_id,
    status_name: status.status_name,
    created_at: existingTicket.created_at || now,
    updated_at: now,
  };
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  if (method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  try {
    if (method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, { status: "ok", service: "jarvis-ticketing-api" });
      return;
    }

    if (method === "POST" && pathname === "/api/auth/login") {
      const body = await parseBody(req);
      const user =
        users.find((item) => item.email.toLowerCase() === String(body.email || "").toLowerCase()) ||
        users[0];

      sendJson(res, 200, {
        token: `demo-token-${user.user_code}`,
        user,
      });
      return;
    }

    if (method === "GET" && pathname === "/api/dashboard/summary") {
      sendJson(res, 200, getDashboardSummary());
      return;
    }

    if (method === "GET" && pathname === "/api/tickets") {
      sendJson(res, 200, tickets);
      return;
    }

    if (method === "GET" && pathname === "/api/master/statuses") {
      sendJson(res, 200, { success: true, data: statuses });
      return;
    }

    if (method === "POST" && pathname === "/api/tickets") {
      const body = await parseBody(req);
      const ticket = normalizeTicketPayload(body);
      tickets = [ticket, ...tickets];
      sendJson(res, 201, ticket);
      return;
    }

    const ticketMatch = pathname.match(/^\/api\/tickets\/(\d+)$/);
    if (ticketMatch) {
      const ticketId = Number(ticketMatch[1]);
      const ticket = tickets.find((item) => item.ticket_id === ticketId);

      if (!ticket) {
        sendJson(res, 404, { message: "Ticket not found" });
        return;
      }

      if (method === "GET") {
        sendJson(res, 200, ticket);
        return;
      }

      if (method === "PUT") {
        const body = await parseBody(req);
        const updatedTicket = normalizeTicketPayload(body, ticket);
        tickets = tickets.map((item) => (item.ticket_id === ticketId ? updatedTicket : item));
        sendJson(res, 200, updatedTicket);
        return;
      }

      if (method === "DELETE") {
        tickets = tickets.filter((item) => item.ticket_id !== ticketId);
        sendJson(res, 200, { message: "Ticket deleted" });
        return;
      }
    }

    const ticketStatusMatch = pathname.match(/^\/api\/tickets\/(\d+)\/status$/);
    if (ticketStatusMatch && method === "PATCH") {
      const ticketId = Number(ticketStatusMatch[1]);
      const ticket = tickets.find((item) => item.ticket_id === ticketId);

      if (!ticket) {
        sendJson(res, 404, { message: "Ticket not found" });
        return;
      }

      const body = await parseBody(req);
      const status = statuses.find((item) => item.status_id === Number(body.status_id));

      if (!status) {
        sendJson(res, 404, { message: "Status not found" });
        return;
      }

      const updatedTicket = {
        ...ticket,
        status_id: status.status_id,
        status_name: status.status_name,
        updated_at: new Date().toISOString(),
      };
      tickets = tickets.map((item) => (item.ticket_id === ticketId ? updatedTicket : item));
      sendJson(res, 200, { success: true, data: updatedTicket });
      return;
    }

    if (method === "GET" && pathname === "/api/users") {
      sendJson(res, 200, users);
      return;
    }

    if (method === "POST" && pathname === "/api/users") {
      const body = await parseBody(req);
      const nextNumber = users.length + 1;
      const user = {
        user_code: body.user_code || `USR-${String(nextNumber).padStart(3, "0")}`,
        first_name: body.first_name || "",
        last_name: body.last_name || "",
        email: body.email || "",
        role_id: roles.includes(body.role_id) ? body.role_id : body.role_id || "User",
        department: body.department || "General",
      };
      users.push(user);
      sendJson(res, 201, user);
      return;
    }

    const userMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
    if (userMatch) {
      const userCode = decodeURIComponent(userMatch[1]);
      const userIndex = users.findIndex((item) => item.user_code === userCode);

      if (userIndex === -1) {
        sendJson(res, 404, { message: "User not found" });
        return;
      }

      if (method === "GET") {
        sendJson(res, 200, users[userIndex]);
        return;
      }

      if (method === "PUT") {
        const body = await parseBody(req);
        users[userIndex] = { ...users[userIndex], ...body, user_code: userCode };
        sendJson(res, 200, users[userIndex]);
        return;
      }

      if (method === "DELETE") {
        users.splice(userIndex, 1);
        sendJson(res, 200, { message: "User deleted" });
        return;
      }
    }

    sendJson(res, 404, { message: "Route not found" });
  } catch (error) {
    sendJson(res, 400, { message: "Invalid request", detail: error.message });
  }
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`Jarvis ticketing API running at http://localhost:${PORT}`);
});
