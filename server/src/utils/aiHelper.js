const { db } = require('../config/firebase');
const logger = require('./logger');

const catalogCache = { data: null, timestamp: 0 };
const CACHE_TTL = 60000;

async function fetchCatalogData() {
  const now = Date.now();
  if (catalogCache.data && now - catalogCache.timestamp < CACHE_TTL) {
    return catalogCache.data;
  }

  try {
    const shopsSnap = await db.collection('pastryShops')
      .where('status', '==', 'approved')
      .get();

    const shops = [];
    if (!shopsSnap || !shopsSnap.docs) return shops;
    for (const shopDoc of shopsSnap.docs) {
      const shop = { id: shopDoc.id, ...shopDoc.data() };
      shop.products = [];

      try {
        const snap = await db.collection('products')
          .where('shop_id', '==', shopDoc.id)
          .where('is_available', '==', true)
          .get();
        if (snap && snap.docs) {
          shop.products = snap.docs.map(p => ({ id: p.id, ...p.data() }));
        }
      } catch (_) {}

      shops.push(shop);
    }

    catalogCache.data = shops;
    catalogCache.timestamp = now;
    return shops;
  } catch (e) {
    logger.error('Error fetching catalog', { error: e.message });
    return catalogCache.data || [];
  }
}

function formatCatalogForContext(shops) {
  if (!shops || shops.length === 0) return '';
  let text = '\n## Catálogo actual de pastelerías\n\n';
  const maxShops = Math.min(shops.length, 10);
  for (let i = 0; i < maxShops; i++) {
    const shop = shops[i];
    text += `- ${shop.name}`;
    if (shop.address) text += `, ${shop.address}`;
    if (shop.phone) text += `, Tel: ${shop.phone}`;
    if (shop.rating && shop.rating > 0) text += `, ⭐ ${Number(shop.rating).toFixed(1)}`;
    text += '\n';
    const productList = shop.products || [];
    if (productList.length === 0) {
      text += '  (Sin productos)\n';
    } else {
      const maxProducts = Math.min(productList.length, 5);
      for (let j = 0; j < maxProducts; j++) {
        const p = productList[j];
        text += `  • ${p.name} - ${p.price ? 'S/ ' + Number(p.price).toFixed(2) : 'Consultar precio'}`;
        if (p.description) text += ` (${p.description})`;
        text += '\n';
      }
      const remaining = productList.length - maxProducts;
      if (remaining > 0) text += `  ... y ${remaining} productos más\n`;
    }
    text += '\n';
  }
  const hidden = shops.length - maxShops;
  if (hidden > 0) text += `... y ${hidden} pastelerías más\n`;
  return text;
}

const ROLE_RULES = {
  customer: {
    allowed: ['pedidos propios', 'pagos', 'productos', 'pastelerías', 'carrito', 'checkout', 'reseñas', 'tickets de soporte', 'boletas', 'perfil', 'notificaciones', 'promociones activas'],
    denied: ['panel de administración', 'panel de dueño', 'panel de moderador', 'gestión de usuarios', 'cambiar roles', 'aprobar pastelerías', 'suspender pastelerías', 'gestionar productos de todas las pastelerías', 'ver pedidos de otros', 'moderar reseñas', 'gestionar reportes', 'asignar moderadores', 'estadísticas globales', 'funcionalidades internas del sistema', 'rutas de API internas'],
  },
  owner: {
    allowed: ['mi pastelería', 'mis productos', 'mis promociones', 'mis pedidos', 'resumen de ventas', 'perfil', 'notificaciones', 'tickets de soporte', 'boletas de mi pastelería'],
    denied: ['panel de administración', 'panel de moderador', 'gestión de usuarios', 'cambiar roles', 'aprobar pastelerías', 'suspender pastelerías', 'gestionar pastelerías de otros', 'moderar reseñas', 'gestionar reportes', 'asignar moderadores', 'estadísticas globales', 'ver pedidos de otras pastelerías'],
  },
  moderator: {
    allowed: ['moderar reseñas', 'gestionar reportes', 'tickets de soporte', 'perfil', 'notificaciones'],
    denied: ['panel de administración', 'gestión de usuarios', 'cambiar roles', 'aprobar pastelerías', 'suspender pastelerías', 'gestionar pastelerías', 'gestionar productos', 'estadísticas globales', 'funcionalidades de dueño de pastelería'],
  },
  admin: {
    allowed: ['todo el sistema'],
    denied: [],
  },
};

function getRoleKey(roles) {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('moderator')) return 'moderator';
  if (roles.includes('owner')) return 'owner';
  return 'customer';
}

async function getAiResponse(userMessage, userData, catalogData) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackResponse(userMessage, userData, catalogData);

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const roleKey = getRoleKey(userData?.roles || []);
    const rules = ROLE_RULES[roleKey];
    const roleLabels = { admin: 'administrador', moderator: 'moderador', owner: 'dueño de pastelería', customer: 'cliente' };
    const roleLabel = roleLabels[roleKey] || 'cliente';

    const catalogContext = formatCatalogForContext(catalogData || []);

    const systemPrompt = `Eres un asistente virtual de PastelHub, una plataforma de pedidos de pastelerías. Tu función es ayudar al usuario DENTRO de lo que su rol le permite.

## Identidad del usuario
- Nombre: ${userData.name || 'Usuario'}
- Rol: ${roleLabel}
- Roles completos: ${(userData.roles || []).join(', ')}

## Reglas estrictas de seguridad (NUNCA las violes)
1. NUNCA reveles información sobre funcionalidades, rutas, endpoints, paneles o características a las que el usuario NO tenga acceso según su rol.
2. Si el usuario pregunta sobre algo fuera de su alcance, responde: "Lo siento, esa funcionalidad no está disponible para tu rol. Si necesitas ayuda, contacta a soporte."
3. NUNCA describas cómo funcionan internamente el panel de administración, las rutas de API, la asignación de roles, la moderación ni ninguna característica interna del sistema a usuarios que no sean admin.
4. NUNCA reveles datos de otros usuarios, pedidos de otros, ni información que no pertenezca al usuario.

## Lo que SÍ puedes responder según el rol del usuario

### ${roleLabel}
Puedes ayudar con: ${rules.allowed.join(', ')}.

NO debes responder sobre: ${rules.denied.join(', ')}.

## Catálogo de pastelerías disponible
Los datos a continuación son INFORMACIÓN PÚBLICA. Puedes compartirla CON CUALQUIER USUARIO que pregunte por pastelerías, productos o precios.${catalogContext}
## Pautas generales
- Responde siempre en español, sé amable y conciso.
- Cuando te pregunten por pastelerías, productos, precios o direcciones, USA LOS DATOS DEL CATÁLOGO de arriba para responder con información real.
- Si el usuario pregunta por una pastelería específica, búscala en el catálogo y dale sus datos (nombre, dirección, teléfono, rating, productos con precios).
- Si no encuentras la información en el catálogo, sugiere revisar la sección de pastelerías en la aplicación.
- Si no sabes la respuesta, sugiere contactar a soporte en la sección de Soporte.
- Si te preguntan cómo hacer algo que no pueden por su rol, indícalo amablemente sin dar detalles de cómo funciona internamente.
- Si te preguntan por URLs, rutas o endpoints específicos, redirige a usar la interfaz de la aplicación.`;

    const chat = model.startChat({
      history: [{ role: 'user', parts: [{ text: systemPrompt }] }],
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (e) {
    logger.error('Gemini API error', { error: e.message });
    return fallbackResponse(userMessage, userData, catalogData);
  }
}

function fallbackResponse(message, userData, catalogData) {
  const roleKey = getRoleKey(userData?.roles || []);
  const lower = message.toLowerCase();

  const restrictedTopics = [
    { words: ['roles', 'cambiar rol', 'asignar rol', 'permisos'], role: 'admin', msg: 'Lo siento, la gestión de roles solo está disponible para administradores.' },
    { words: ['moderar', 'moderador', 'reportes', 'reseñas pendientes'], role: 'moderator', msg: 'Lo siento, la moderación de contenido solo está disponible para moderadores y administradores.' },
    { words: ['dueño', 'owner', 'pastelería propia', 'mis ventas', 'dashboard dueño'], role: 'owner', msg: 'Lo siento, la gestión de pastelerías solo está disponible para dueños de pastelería.' },
    { words: ['admin', 'administrador', 'panel admin', 'usuarios'], role: 'admin', msg: 'Lo siento, el panel de administración solo está disponible para usuarios con rol de administrador.' },
  ];

  for (const topic of restrictedTopics) {
    const isRestricted = topic.words.some(w => lower.includes(w));
    if (isRestricted) {
      const allowedRoles = ['admin', 'moderator', 'owner', 'customer'].slice(0, ['admin', 'moderator', 'owner', 'customer'].indexOf(topic.role) + 1);
      if (!allowedRoles.includes(roleKey)) {
        return topic.msg;
      }
    }
  }

  if (lower.includes('pedido') || lower.includes('orden')) {
    if (roleKey === 'customer') return 'Puedes revisar el estado de tus pedidos en la sección "Mis órdenes".';
    if (roleKey === 'owner') return 'Puedes revisar los pedidos de tu pastelería en la sección "Dueño".';
    return 'Puedes revisar todos los pedidos en el panel de administración.';
  }
  if (lower.includes('pago') || lower.includes('pagar')) {
    return 'Aceptamos tarjeta, efectivo, Yape y Plin. El pago se confirma al momento de la entrega.';
  }

  const catalogKeywords = ['pastelería', 'pastelerias', 'pasteleria', 'pastelerías', 'tienda', 'tiendas', 'producto', 'productos', 'precio', 'precios', 'menú', 'menu', 'catálogo', 'catalogo', 'ubicación', 'ubicacion', 'dirección', 'direccion', 'dónde', 'donde', 'comprar', 'venden'];
  const hasCatalogQuery = catalogKeywords.some(w => lower.includes(w));

  if (hasCatalogQuery) {
    if (!catalogData || catalogData.length === 0) {
      return 'Actualmente no hay pastelerías disponibles en la plataforma. Vuelve pronto para descubrir nuevas opciones.';
    }
    return buildCatalogResponse(lower, catalogData);
  }

  if (lower.includes('hola') || lower.includes('buenos') || lower.includes('ayuda')) {
    const greetings = {
      customer: '¡Hola! Soy el asistente virtual de PastelHub. Puedo ayudarte con tus pedidos, productos, pagos y más. ¿En qué puedo ayudarte?',
      owner: '¡Hola! Soy el asistente virtual de PastelHub. Puedo ayudarte con la gestión de tu pastelería, productos, pedidos y promociones. ¿En qué puedo ayudarte?',
      moderator: '¡Hola! Soy el asistente virtual de PastelHub. Puedo ayudarte con la moderación de reseñas y reportes. ¿En qué puedo ayudarte?',
      admin: '¡Hola! Soy el asistente virtual de PastelHub. Puedo ayudarte con cualquier funcionalidad del sistema. ¿En qué puedo ayudarte?',
    };
    return greetings[roleKey] || greetings.customer;
  }
  return 'Gracias por tu mensaje. Estoy en modo offline en este momento. Si necesitas ayuda urgente, por favor escribe a soporte en la sección de Soporte.';
}

function buildCatalogResponse(lower, catalogData) {
  const shopMatch = catalogData.find(s => {
    if (lower.includes(s.name.toLowerCase())) return true;
    const words = s.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return words.some(w => lower.includes(w));
  });
  if (shopMatch) {
    let res = `**${shopMatch.name}**\n`;
    if (shopMatch.description) res += `${shopMatch.description}\n`;
    if (shopMatch.address) res += `📍 ${shopMatch.address}\n`;
    if (shopMatch.phone) res += `📞 ${shopMatch.phone}\n`;
    if (shopMatch.rating && shopMatch.rating > 0) res += `⭐ ${Number(shopMatch.rating).toFixed(1)}\n`;
    const products = shopMatch.products || [];
    if (products.length > 0) {
      res += '\n**Productos disponibles:**\n';
      for (const p of products) {
        res += `• ${p.name} - ${p.price ? 'S/ ' + Number(p.price).toFixed(2) : 'Consultar precio'}`;
        if (p.description) res += ` (${p.description})`;
        res += '\n';
      }
    } else {
      res += '\n*Esta pastelería aún no tiene productos disponibles.*';
    }
    res += '\nPuedes ver más detalles en la sección de pastelerías de la aplicación.';
    return res;
  }

  const productSearch = catalogData.flatMap(s =>
    (s.products || []).filter(p => lower.includes(p.name.toLowerCase())).map(p => ({ shop: s, product: p }))
  );
  if (productSearch.length > 0) {
    let res = 'Encontré estos productos:\n';
    for (const match of productSearch.slice(0, 5)) {
      const price = match.product.price ? 'S/ ' + Number(match.product.price).toFixed(2) : 'Consultar precio';
      res += `• ${match.product.name} - ${price} en ${match.shop.name}`;
      if (match.shop.address) res += ` (${match.shop.address})`;
      res += '\n';
    }
    return res;
  }

  const hasShopNameRef = /\b(pastelería|pasteleria|tienda)\s+[a-záéíóúñ]+/i.test(lower);
  if (hasShopNameRef) {
    return 'No encontré información sobre esa pastelería. Es posible que no esté disponible actualmente o no exista en la plataforma. Puedes ver las pastelerías disponibles en la sección de inicio.';
  }

  let res = 'Estas son nuestras pastelerías disponibles:\n';
  for (const shop of catalogData) {
    res += `\n• **${shop.name}**`;
    if (shop.address) res += ` - ${shop.address}`;
    if (shop.phone) res += ` (${shop.phone})`;
    if (shop.rating && shop.rating > 0) res += ` ⭐ ${Number(shop.rating).toFixed(1)}`;
    const productCount = (shop.products || []).length;
    res += `\n  ${productCount > 0 ? productCount + ' productos disponibles' : 'Sin productos por el momento'}`;
  }
  res += '\n\nPuedes ver más detalles en la sección de pastelerías de la aplicación.';
  return res;
}

module.exports = { fetchCatalogData, formatCatalogForContext, getRoleKey, ROLE_RULES, getAiResponse, fallbackResponse, buildCatalogResponse };
