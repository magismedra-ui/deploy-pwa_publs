import { useRef } from 'react'

/**
 * Evita que una petición antigua deje `loading` en true o en false
 * cuando hay recargas solapadas (p. ej. Strict Mode o refrescos rápidos).
 */
export function useLoadSequence() {
	const seqRef = useRef(0)

	function next(): number {
		seqRef.current += 1
		return seqRef.current
	}

	function isCurrent(seq: number): boolean {
		return seq === seqRef.current
	}

	return { next, isCurrent }
}
