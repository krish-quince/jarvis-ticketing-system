export const canAccessTicket = (ticket, user) => {
    if (!user) return false;

    if ([1, 4].includes(Number(user.roleId))) {
        return true;
    }

    return (
        ticket.assigned_to_user_code === user.userCode ||
        ticket.raised_by_user_code === user.userCode ||
        Number(ticket.department_id) === (user.departmentId)
    );
};

export const canManageTicket = (ticket, user) => {
    if (!user) return false;

    if ([1, 4].includes(Number(user.roleId))) {
        return true;
    }

    return ticket.assigned_to_user_code === user.userCode || ticket.raised_by_user_code === user.userCode;
};
