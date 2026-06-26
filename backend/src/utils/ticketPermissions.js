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

export const checkAllocatedTakeoverBlock = (ticket, user) => {
    if (!user || !ticket) return;

    if ([1, 4].includes(Number(user.roleId))) {
        return;
    }

    const allocatedList = ticket.allocated_to_user_code
        ? ticket.allocated_to_user_code.split("|").map(c => c.trim()).filter(Boolean)
        : [];
    const isAllocated = allocatedList.includes(user.userCode);
    const hasAssignee = !!ticket.assigned_to_user_code;
    const isNotAssignee = ticket.assigned_to_user_code !== user.userCode;

    if (isAllocated && hasAssignee && isNotAssignee) {
        throw new Error("Ticket is already assigned. Please takeover to make changes.");
    }
};
