const success = { description: 'Successful response', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, data: {}, message: { type: 'string' } } } } } };
const secured = [{ cookieAuth: [] }];

export const openApiDefinition = {
  openapi: '3.0.3',
  info: { title: 'NIRIKSHAN-X API', version: '1.0.0', description: 'Government Project Monitoring & Resolution System REST API.' },
  servers: [{ url: '/api' }],
  components: { securitySchemes: { cookieAuth: { type: 'apiKey', in: 'cookie', name: 'access_token' } }, responses: { Success: success, Unauthorized: { description: 'Authentication required' }, Forbidden: { description: 'Insufficient role permission' } } },
  paths: {
    '/health': { get: { summary: 'Application and database health', responses: { '200': success, '503': success } } },
    '/auth/login': { post: { summary: 'Start a cookie-based session', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } } } } }, responses: { '200': success, '401': { description: 'Invalid credentials' } } } },
    '/auth/logout': { post: { summary: 'End the current session', responses: { '200': success } } },
    '/auth/refresh': { post: { summary: 'Rotate refresh token', responses: { '200': success, '401': { description: 'Expired session' } } } },
    '/auth/me': { get: { security: secured, summary: 'Current user', responses: { '200': success, '401': { $ref: '#/components/responses/Unauthorized' } } } },
    '/projects': { get: { summary: 'Public searchable projects', parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }, { name: 'status', in: 'query', schema: { type: 'string', enum: ['ON_TRACK', 'AT_RISK', 'CRITICAL', 'COMPLETED'] } }, { name: 'page', in: 'query', schema: { type: 'integer' } }], responses: { '200': success } }, post: { security: secured, summary: 'Create a project (officer)', responses: { '201': success, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' } } } },
    '/projects/{id}': { get: { summary: 'Public project details', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': success } }, put: { security: secured, summary: 'Update a project', responses: { '200': success } }, delete: { security: secured, summary: 'Delete a project', responses: { '200': success } } },
    '/projects/{id}/progress': { patch: { security: secured, summary: 'Record verified progress and recalculate risk', responses: { '200': success } } },
    '/issues': { get: { security: secured, summary: 'List issues', responses: { '200': success } }, post: { security: secured, summary: 'Create issue', responses: { '201': success } } },
    '/grievances': { get: { security: secured, summary: 'Officer grievance queue', responses: { '200': success } }, post: { summary: 'Submit a public grievance', responses: { '201': success } } },
    '/grievances/track/{trackingId}': { get: { summary: 'Track public grievance', responses: { '200': success } } },
    '/dashboard/summary': { get: { summary: 'Public dynamic dashboard totals', responses: { '200': success } } },
    '/gis/projects': { get: { summary: 'Public GIS marker records', responses: { '200': success } } },
    '/analytics/{dataset}': { get: { security: secured, summary: 'Operational analytics', parameters: [{ name: 'dataset', in: 'path', required: true, schema: { type: 'string', enum: ['status', 'states', 'departments', 'budget', 'progress', 'risk', 'delays'] } }], responses: { '200': success } } },
    '/ai/analyze-project/{id}': { post: { security: secured, summary: 'Backend project risk analysis', responses: { '200': success } } },
    '/reports/projects': { get: { security: secured, summary: 'Live JSON, CSV or PDF project report', responses: { '200': success } } },
    '/users': { get: { security: secured, summary: 'List users (admin)', responses: { '200': success } }, post: { security: secured, summary: 'Create user (admin)', responses: { '201': success } } },
    '/notifications': { get: { security: secured, summary: 'Current user notifications', responses: { '200': success } } },
    '/audit-logs': { get: { security: secured, summary: 'Audit log (admin)', responses: { '200': success } } }
  }
};
