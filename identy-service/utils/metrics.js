// utils/metrics.js
import promClient from 'prom-client';

// Enable default metrics like CPU, memory, etc.
promClient.collectDefaultMetrics();

export const metrics = {
    requests: new promClient.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status']
    }),
    errors: new promClient.Counter({
        name: 'http_errors_total',
        help: 'Total number of HTTP errors',
        labelNames: ['method', 'route', 'error_code']
    }),
    responseTime: new promClient.Histogram({
        name: 'http_response_time_seconds',
        help: 'Response time of HTTP requests in seconds',
        labelNames: ['method', 'route'],
        buckets: [0.1, 0.5, 1, 2, 5] // Custom buckets for response time
    }),
    successfulLogins: new promClient.Counter({
        name: 'auth_successful_logins_total',
        help: 'Total number of successful logins'
    }),
    failedLogins: new promClient.Counter({
        name: 'auth_failed_logins_total',
        help: 'Total number of failed logins',
        labelNames: ['reason']
    }),
    registrations: new promClient.Counter({
        name: 'auth_registrations_total',
        help: 'Total number of user registrations',
        labelNames: ['method', 'route', 'status']
    })
};

// Expose metrics endpoint for Prometheus
export const metricsMiddleware = async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
};        // Recursively sanitize object properties
