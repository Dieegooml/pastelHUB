// Helper de paginación para Firestore
// Uso: const { data, total } = await paginate(col, req.query, { orderBy: 'createdAt', filters: [...] });

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(query.pageSize) || 10));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

async function paginate(collectionRef, queryParams, opts = {}) {
  const { page, pageSize, offset } = parsePagination(queryParams);
  let ref = collectionRef;

  if (opts.orderBy) ref = ref.orderBy(opts.orderBy, opts.orderDir || 'desc');
  if (opts.filters) opts.filters.forEach(f => { ref = ref.where(f.field, f.op || '==', f.value); });

  const totalSnap = await ref.count().get();
  const total = totalSnap.data().count;

  const dataSnap = await ref.offset(offset).limit(pageSize).get();
  const data = dataSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

module.exports = { paginate, parsePagination };
