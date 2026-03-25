// ============================================================
// Admin Only Middleware
// ============================================================

export async function adminOnly(c, next) {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  if (!user.isAdmin) {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }
  
  await next();
}
