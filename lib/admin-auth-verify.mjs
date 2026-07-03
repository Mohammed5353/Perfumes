import { getAdminApiKeyFromHeaders, isValidAdminApiKey } from './admin-auth.ts';

const headers = new Headers({ 'x-api-key': 'scentora-admin-key' });
console.log('headerKey', getAdminApiKeyFromHeaders(headers));
console.log('valid', isValidAdminApiKey(getAdminApiKeyFromHeaders(headers)));
