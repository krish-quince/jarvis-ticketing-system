export const canAccessTicket = (ticket, user) => {
    if (!user) return false;

    if ([1, 4].includes(Number(user.roleId))) {
        return true;
    }

    const allocatedList = ticket.allocated_to_user_code
        ? ticket.allocated_to_user_code.split("|").map(c => c.trim())
        : [];
    const isAllocated = allocatedList.includes(user.userCode);

    return (
        ticket.assigned_to_user_code === user.userCode ||
        ticket.raised_by_user_code === user.userCode ||
        Number(ticket.department_id) === Number(user.departmentId) ||
        isAllocated
    );
};

export const canManageTicket = (ticket, user) => {
    if (!user) return false;

    if ([1, 4].includes(Number(user.roleId))) {
        return true;
    }

    const allocatedList = ticket.allocated_to_user_code
        ? ticket.allocated_to_user_code.split("|").map(c => c.trim()).filter(Boolean)
        : [];
    const isAllocated = allocatedList.includes(user.userCode);

    // Creator, assigned user, and allocated users can chat / manage metadata
    return (
        ticket.assigned_to_user_code === user.userCode ||
        ticket.raised_by_user_code === user.userCode ||
        isAllocated
    );
};
