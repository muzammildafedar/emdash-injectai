/**
 * Type shim for @emdash-cms/admin.
 * Adds usePluginAPI which is documented but not yet exported by the installed package.
 */
declare module "@emdash-cms/admin" {
  export function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;
  export interface PluginAPI {
    get(route: string): Promise<unknown>;
    post(route: string, body?: unknown): Promise<unknown>;
  }
  export function usePluginAPI(): PluginAPI;
  export const useCurrentUser: unknown;
  export const useNavigate: unknown;
  export const useParams: unknown;
  export const usePluginAdmins: unknown;
  export const usePluginPage: unknown;
  export const usePluginWidget: unknown;
  export const usePluginField: unknown;
  export const usePluginHasPages: unknown;
  export const usePluginHasWidgets: unknown;
  export const PluginAdminProvider: unknown;
  export const cn: (...args: unknown[]) => string;
  export const Card: unknown;
  export const Button: unknown;
  export const Input: unknown;
  export const Select: unknown;
  export const Toggle: unknown;
  export const Table: unknown;
  export const Loading: unknown;
  export const Alert: unknown;
}
