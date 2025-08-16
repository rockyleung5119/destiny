// custom.d.ts
// This file tells TypeScript how to handle imports for non-JavaScript/TypeScript assets.

// For .sql files
declare module '*.sql' {
  const content: string;
  export default content;
}

// For .html files (which we are also importing)
declare module '*.html' {
  const content: string;
  export default content;
}
