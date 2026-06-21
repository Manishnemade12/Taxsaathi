export function authMiddleware(sb) {
  return async (req, res, next) => {
    try {
      const authHeader = req.header('Authorization');
      if (!authHeader) {
        return res.status(401).json({ error: 'missing authorization header' });
      }

      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'invalid authorization format' });
      }

      const token = authHeader.slice('Bearer '.length).trim();
      const { userId, email } = await sb.validateToken(token);

      req.user = { id: userId, email, jwt: token };
      return next();
    } catch (error) {
      return res.status(401).json({ error: `unauthorized: ${error.message}` });
    }
  };
}
