export type AuthUser = {
  id: number;
  name: string;
  email: string;
  tenant_id: number | null;
};

export type AuthTenant = {
  id: number;
  name: string;
  api_key?: string;
  subscription_plan?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  tenant_name?: string;
};

export type LoginResponseData = {
  user: AuthUser;
  token: string;
};

export type RegisterResponseData = {
  user: AuthUser;
  token: string;
  tenant: AuthTenant;
};

export type ProfileResponseData = {
  user: AuthUser;
  tenant: AuthTenant | null;
};
