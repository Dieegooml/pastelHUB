const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
    return res.status(400).json({ error: messages.join('; ') });
  }
  req.body = result.data;
  next();
};

module.exports = { validate };