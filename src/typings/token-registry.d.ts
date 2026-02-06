/**
 * Stub type declarations for @tradetrust-tt/token-registry.
 * The package's shipped types are built for an older ethers API and cause
 * TS errors when resolved against ethers v6. This stub is used instead
 * so the app compiles; runtime still uses the real package from node_modules.
 */
declare module '@tradetrust-tt/token-registry' {
  const tokenRegistry: any;
  export = tokenRegistry;
}
