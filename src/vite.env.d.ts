declare module '*.css?raw' {
  const content: string
  export default content
}

interface ImportMetaEnv {
  readonly VITE_OS_MAPS_AUTH_URL?: string
  readonly VITE_OS_MAPS_VECTOR_BASE_URL?: string
  readonly VITE_OS_MAPS_RASTER_URL?: string
  readonly VITE_OS_MAPS_API_KEY?: string
  readonly VITE_OS_MAPS_API_SECRET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
