/**
 * @backward-compat
 * This shim re-exports `apiClient` under the legacy `api` name so that
 * non-admin components can continue to import `{ api } from "@/lib/api"`.
 *
 * NOTE: New code should import directly from "@/lib/api-client".
 */
export { apiClient as api, getErrorMessage } from "@/lib/api-client";
