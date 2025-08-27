declare module '*.css?raw' {
  const content: string
  export default content
}

interface ImportMetaEnv {
  readonly VITE_OS_API_KEY: string
  readonly VITE_OS_MAPS_TILE_URL?: string
  readonly VITE_OS_MAPS_VECTOR_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
