# Data Protection & Privacy

<span className="badge-implemented">Implemented</span>

- Passwords are never logged by the Pino HTTP serializer.
- Database access uses parameterized queries via Drizzle ORM, eliminating SQL injection.
