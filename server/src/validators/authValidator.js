const { z } = require('zod');

const VALID_ROLES = ['admin', 'moderator', 'owner', 'customer'];

const assignRoleSchema = z.object({
  uid: z.string().min(1, 'uid es requerido'),
  roles: z.array(z.enum(VALID_ROLES, {
    errorMap: () => ({ message: `Roles inválidos. Válidos: ${VALID_ROLES.join(', ')}` }),
  })).min(1, 'roles debe tener al menos un elemento'),
});

module.exports = { assignRoleSchema };
