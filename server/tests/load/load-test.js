import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const TARGET = (__ENV.TARGET_URL || 'http://localhost:3001').replace(/\/+$/, '');
const MAX_VUS = parseInt(__ENV.MAX_VUS || '1000', 10);
const STEADY_MINUTES = parseInt(__ENV.STEADY_MINUTES || '5', 10);
const WITH_AUTH = __ENV.LOAD_TEST === 'true';

const endpoints = [
  { path: '/api/health',      name: 'Health Check'      },
  { path: '/api/products',    name: 'List Products'      },
  { path: '/api/shops',       name: 'List Shops'         },
  { path: '/api/users',       name: 'List Users'         },
  { path: '/api/orders',      name: 'List Orders'        },
  { path: '/api/reviews',     name: 'List Reviews'       },
  { path: '/api/payments',    name: 'List Payments'      },
  { path: '/api/notifications', name: 'List Notifications' },
  { path: '/api/reports',     name: 'List Reports'       },
  { path: '/api/customers',   name: 'List Customers'     },
];

const stages = [
  { duration: '30s',  target: Math.min(MAX_VUS, 100)            },
  { duration: '60s',  target: Math.min(MAX_VUS, Math.round(MAX_VUS * 0.5)) },
  { duration: '120s', target: MAX_VUS                                     },
  { duration: `${STEADY_MINUTES}m`, target: MAX_VUS                       },
  { duration: '60s',  target: Math.round(MAX_VUS * 0.3)                  },
  { duration: '30s',  target: 0                                           },
];

export const options = {
  stages,
  thresholds: {
    http_req_duration: ['p(95)<5000', 'p(99)<10000'],
    http_req_failed:   ['rate<0.02'],
  },
  tags: {
    test_type: 'load',
    target: TARGET,
    max_vus: String(MAX_VUS),
  },
};

function pickEndpoint() {
  return endpoints[Math.floor(Math.random() * endpoints.length)];
}

function authHeaders() {
  if (!WITH_AUTH) return {};
  return { Authorization: 'Bearer load-test-token' };
}

export default function () {
  const ep = pickEndpoint();
  const url = `${TARGET}${ep.path}`;

  const res = http.get(url, { headers: authHeaders() });

  const statusOk = res.status >= 200 && res.status < 400;
  check(res, {
    [`${ep.name} ok`]: () => statusOk,
    [`${ep.name} <2s`]: () => res.timings.duration < 2000,
  });

  sleep(randomIntBetween(300, 1500) / 1000);
}