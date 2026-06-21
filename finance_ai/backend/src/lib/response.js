export function jsonError(res, message, status = 500) {
  return res.status(status).json({ error: message });
}

export function jsonResponse(res, data) {
  return res.json(data);
}
