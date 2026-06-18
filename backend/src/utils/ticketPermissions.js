export const canAccessTicket = (ticket, user) => {
    if (!user) return false;

    if (Number(user.roleId) === 1) {
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

    if (Number(user.roleId) === 1) {
        return true;
    }

    return ticket.assigned_to_user_code === user.userCode || ticket.raised_by_user_code === user.userCode;
};
