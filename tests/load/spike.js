import http from 'k6/http';
import { check, sleep } from 'k6';
import { assertApprovedStaging } from './guard.js';

const base = assertApprovedStaging();
export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '30s', target: 150 },
    { duration: '20s', target: 150 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1200'],
    http_req_failed: ['rate<0.02'],
  },
};

export default function () {
  const path = ['/','/livros','/clubes','/calendario'][__ITER % 4];
  const res = http.get(`${base}${path}`, { tags: { route: path } });
  check(res, { 'HTTP 2xx/3xx esperado': (r) => r.status >= 200 && r.status < 400 });
  sleep(1);
}
