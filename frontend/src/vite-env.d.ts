/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.module.scss' {
	const classes: { readonly [key: string]: string }
	export default classes
}

interface ImportMetaEnv {
	readonly VITE_API_URL: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
