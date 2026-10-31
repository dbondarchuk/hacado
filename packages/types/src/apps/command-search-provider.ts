import type { SessionUser } from "../users/session-user";
import type { ConnectedAppData } from "./connected-app.data";

export type CommandSearchHit = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  /** Photo or avatar. `fallback` is initials when `src` is missing. */
  image?: {
    src?: string;
    fallback: string;
  };
};

export type CommandSearchGroup = {
  id: string;
  labelKey: string;
  listHref?: string;
  items: CommandSearchHit[];
};

export type CommandSearchInput = {
  query: string;
  limit: number;
  user: SessionUser;
  /** Canonical search scope, such as `customers` or `blog-posts`. */
  type?: string;
};

/**
 * Implemented by connected apps that declare the `command-search-provider` scope.
 * Return no groups when the member cannot read the app's records.
 */
export interface ICommandSearchProvider {
  searchCommand(
    appData: ConnectedAppData,
    input: CommandSearchInput,
  ): Promise<CommandSearchGroup[]>;
}
