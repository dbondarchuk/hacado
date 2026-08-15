declare module "geoip-lite" {
  export interface Lookup {
    country: string;
  }

  export function lookup(ip: string | number): Lookup | null;
}
