const MOCK_USERS = {
  customer: {
    uid: 'test-customer-uid',
    email: 'cliente@test.com',
    displayName: 'Cliente Test',
    roles: ['customer'],
  },
  admin: {
    uid: 'test-admin-uid',
    email: 'admin@test.com',
    displayName: 'Admin Test',
    roles: ['admin', 'customer'],
  },
  owner: {
    uid: 'test-owner-uid',
    email: 'owner@test.com',
    displayName: 'Owner Test',
    roles: ['owner', 'customer'],
  },
  moderator: {
    uid: 'test-mod-uid',
    email: 'mod@test.com',
    displayName: 'Mod Test',
    roles: ['moderator', 'customer'],
  },
};

function createInitScript(user) {
  return `
(function() {
  var USER = ${JSON.stringify(user)};
  var origGetItem = Storage.prototype.getItem;
  Storage.prototype.getItem = function(key) {
    if (typeof key === 'string' && key.indexOf('firebase:authUser:') === 0) {
      return JSON.stringify({
        uid: USER.uid,
        email: USER.email,
        displayName: USER.displayName,
        photoURL: null,
        stsTokenManager: {
          refreshToken: 'mock-rt-' + USER.uid,
          accessToken: createToken(USER),
          expirationTime: Date.now() + 3600000,
        },
        providerData: [{ providerId: 'password', uid: USER.email }],
      });
    }
    return origGetItem.call(this, key);
  };
  var origFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    var url = (typeof input === 'string' ? input : input.url) || '';
    if (url.indexOf('securetoken.googleapis.com') !== -1) {
      return Promise.resolve(new Response(JSON.stringify({
        access_token: createToken(USER),
        expires_in: '3600',
        token_type: 'Bearer',
        refresh_token: 'mock-rt-' + USER.uid,
        id_token: createToken(USER),
        user_id: USER.uid,
        project_id: 'pastelhub-2d2b2',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    if (url.indexOf('identitytoolkit.googleapis.com') !== -1) {
      return Promise.resolve(new Response(JSON.stringify({
        kind: 'identitytoolkit#VerifyPasswordResponse',
        registered: true,
        localId: USER.uid,
        email: USER.email,
        displayName: USER.displayName,
        idToken: createToken(USER),
        refreshToken: 'mock-rt-' + USER.uid,
        expiresIn: '3600',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return origFetch(input, init);
  };
  function createToken(user) {
    var h = { alg: 'RS256', typ: 'JWT' };
    var p = {
      sub: user.uid, user_id: user.uid,
      email: user.email, name: user.displayName,
      firebase: { identities: {}, sign_in_provider: 'password', roles: user.roles },
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + 7200,
      aud: 'pastelhub-2d2b2',
      iss: 'https://securetoken.google.com/pastelhub-2d2b2',
    };
    function b(o) { return btoa(JSON.stringify(o)).replace(/=+$/, ''); }
    return b(h) + '.' + b(p) + '.mock-signature';
  }
})();
`;
}

export async function setupAuth(page, { roles = ['customer'] } = {}) {
  const user = { ...MOCK_USERS.customer, roles };
  const script = createInitScript(user);
  await page.addInitScript(script);
}

export async function setupApiMocks(page, handlers = {}) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    const key = `${method}:${path}`;
    if (handlers[key]) {
      return handlers[key](route);
    }

    if (handlers.default) {
      return handlers.default(route);
    }

    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Not mocked' }),
    });
  });
}

export async function setupPage(page, { roles = ['customer'], apiHandlers = {} } = {}) {
  await setupAuth(page, { roles });
  if (Object.keys(apiHandlers).length > 0) {
    await setupApiMocks(page, apiHandlers);
  }
}
