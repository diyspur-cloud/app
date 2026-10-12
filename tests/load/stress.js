import http from 'k6/http';
import { check, sleep } from 'k6';
import { assertApprovedStaging } from './guard.js';

const base = assertApprovedStaging();
export const options = {
  stages: [
    { duration: '1m', target: 25 },
    { duration: '2m', target: 75 },
    { duration: '2m', target: 150 },
    { duration: '2m', target: 300 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.02'],
  },
};

export default function () {
  const res = http.get(`${base}/livros`);
  check(res, { 'catálogo responde': (r) => r.status >= 200 && r.status < 400 });
  sleep(1);
}
