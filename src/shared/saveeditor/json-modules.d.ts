// The d2r-saver game-data JSONs are multi-MB. Declare them as `unknown` so tsc
// does NOT infer their enormous literal object types (which would slow `tcheck`
// to a crawl / blow memory). They are cast to the lib's expected argument shapes
// at the single call site in gameData.ts.
declare module "d2r-saver/data/data.json" {
  const value: unknown;
  export default value;
}
declare module "d2r-saver/data/strings.json" {
  const value: unknown;
  export default value;
}
