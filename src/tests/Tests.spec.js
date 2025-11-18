import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getContactsDuration = new Trend('get_contacts', true);
export const RateContentOK = new Rate('content_OK');
export const RateRedirects = new Rate('redirects_rate');

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.30'],
    get_contacts: ['p(99)<500'],
    content_OK: ['rate>0.95'],
    redirects_rate: ['rate<0.10'],
    http_req_duration: ['p(95)<800'] 
  },
  stages: [
    { duration: '12s', target: 7 },
    { duration: '12s', target: 28 },
    { duration: '12s', target: 92 }
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://www1.satc.edu.br/portais/acesso/public/#/';

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const OK = 200;
  const REDIRECT = 302;

  const res = http.get(`${baseUrl}`, params);

  getContactsDuration.add(res.timings.duration);
  RateContentOK.add(res.status === OK);
  RateRedirects.add(res.status === REDIRECT);

  check(res, {
    'GET Contacts - Status 200': () => res.status === OK,
    'Sem redirecionamento inesperado': () => res.status !== REDIRECT
  });
}
