/**
 * @deprecated - Use `apiClient` from `@/lib/api-client` instead.
 *
 * This file is kept for backwards compatibility while components are being
 * migrated to use the new hooks in `lib/hooks/`.
 *
 * The `api` export here is identical to `apiClient` from `lib/api-client.ts`.
 */

export { apiClient as api, getErrorMessage } from "@/lib/api-client";
export { default as axios } from "axios";
