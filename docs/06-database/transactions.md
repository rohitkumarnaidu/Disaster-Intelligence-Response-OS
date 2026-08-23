# Transactional Integrity

<span className="badge-implemented">Implemented</span>

Multi-step operational mutations are wrapped in database transactions via `db.transaction(async (tx) => { ... })`.
