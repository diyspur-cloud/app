import http from 'k6/http';
import { check, sleep } from 'k6';
import { assertApprovedStaging } from './guard.js';

const base = assertApprovedStaging();
export const options = {
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  for (const path of ['/', '/livros', '/clubes', '/calendario']) {
    const res = http.get(`${base}${path}`, { tags: { route: path } });
    check(res, {
      [`${path} retorna 2xx`]: (r) => r.status >= 200 && r.status < 300,
    });
  }
  sleep(1);
}
