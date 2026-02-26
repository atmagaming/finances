// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

declare global {
  namespace App {
    interface Locals {
      user: import("$lib/types").SessionUser | null;
    }
  }
}

export {};
