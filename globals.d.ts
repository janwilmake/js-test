// js.d.ts

// First declare everything from util.js as it loads first
declare function parsePathname(pathname: string): {
  contextUrl?: string;
  rawContextUrl?: string;
  isContextUrlDesired?: boolean;
  desiredContextUrlFormatted?: string;
  modelName?: string;
  message?: string;
  page?: string;
  name?: string;
  ext?: string;
};

declare function createPathname(components: {
  contextUrl: string;
  modelName?: string;
  message?: string;
  page?: string;
  ext?: string;
}): string;

declare function prependProtocol(url: string): string;
declare function withoutProtocol(url: string): string;

interface Window {
  data?: {
    models?: Array<{
      provider: string;
      description: string;
      online: boolean;
      models: Array<{
        id: string;
        title?: string;
        completionCpm: number;
      }>;
    }>;
    sponsor?: {
      balance: number;
      is_authenticated: boolean;
      avatar_url?: string;
      owner_login: string;
    };
    context?: any;
    cache?: {
      input: {
        messages: Array<{
          role: string;
          content: string;
        }>;
      };
      output: {
        choices: Array<{
          message: {
            content: string;
          };
        }>;
        codeblocks?: any[];
      };
    };
  };
}

// Then header.js
interface Question {
  askedBy: {
    name: string;
    text: string;
  };
  text: string;
}

// Then navigation.js
declare function getDomain(url: string): string;
declare function truncate(str: string, n: number): string;
declare function getPathWithoutDomain(url: string): string;
declare function deleteContext(url: string): void;
declare function deleteDomain(domain: string): void;
declare function toggleCollapse(domain: string): void;
declare function addContext(url: string): Promise<void>;
declare function renderNavigation(): void;
