export interface CertificateMetadata {
	id: string;
	title: string;
	issuer: string;
	date: Date;
	hours?: number;
	category: string;
}

export interface Certificate<TImage> {
	id: string;
	title: string;
	issuer?: string;
	date?: Date;
	hours?: number;
	category: string;
	image: TImage;
}

const UNCATEGORIZED = 'other';
const FILENAME_PREFIXES = /^(diploma|certificado|certificate|cert)-/;

/** `src/assets/certificates/diploma-fundamentos-python.webp` → `diploma-fundamentos-python` */
export function certificateIdFromPath(path: string): string {
	const fileName = path.split(/[\\/]/).pop() ?? '';
	const id = fileName.replace(/\.[a-z0-9]+$/i, '');
	if (!id) {
		throw new Error(`certificates: no se pudo obtener un id de "${path}"`);
	}
	return id;
}

/** Título de respaldo para un certificado sin metadatos: `diploma-fundamentos-python` → `Fundamentos python`. */
export function titleFromCertificateId(id: string): string {
	const words = id.replace(FILENAME_PREFIXES, '').split(/[-_]+/).filter(Boolean).join(' ');
	if (!words) return id;
	return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * La carpeta de imágenes es la fuente de verdad: cada imagen es un certificado.
 * Los metadatos lo enriquecen; una imagen sin metadatos se muestra igual (primero, por ser nueva).
 * Metadatos sin imagen son un error de contenido y rompen el build.
 */
export function mergeCertificates<TImage>(
	images: Record<string, TImage>,
	metadata: CertificateMetadata[],
): Certificate<TImage>[] {
	const metadataById = new Map(metadata.map((entry) => [entry.id, entry]));
	const imageIds = new Set<string>();

	const certificates = Object.entries(images).map(([path, image]): Certificate<TImage> => {
		const id = certificateIdFromPath(path);
		imageIds.add(id);
		const entry = metadataById.get(id);
		if (!entry) {
			return { id, title: titleFromCertificateId(id), category: UNCATEGORIZED, image };
		}
		return { ...entry, image };
	});

	const orphans = metadata.filter((entry) => !imageIds.has(entry.id)).map((entry) => entry.id);
	if (orphans.length > 0) {
		throw new Error(
			`certificates: hay metadatos sin imagen en src/assets/certificates/: ${orphans.join(', ')}`,
		);
	}

	return certificates.sort(compareNewestFirst);
}

function compareNewestFirst<TImage>(a: Certificate<TImage>, b: Certificate<TImage>): number {
	if (!a.date && !b.date) return a.title.localeCompare(b.title, 'es');
	if (!a.date) return -1;
	if (!b.date) return 1;
	return b.date.getTime() - a.date.getTime() || a.title.localeCompare(b.title, 'es');
}

export function totalCertificateHours(certificates: { hours?: number }[]): number {
	return certificates.reduce((total, certificate) => total + (certificate.hours ?? 0), 0);
}

/** Categorías presentes, en el orden de `preferredOrder` (las desconocidas al final). */
export function certificateCategories(
	certificates: { category: string }[],
	preferredOrder: readonly string[],
): string[] {
	const present = new Set(certificates.map((certificate) => certificate.category));
	const known = preferredOrder.filter((category) => present.has(category));
	const unknown = [...present].filter((category) => !preferredOrder.includes(category)).sort();
	return [...known, ...unknown];
}
