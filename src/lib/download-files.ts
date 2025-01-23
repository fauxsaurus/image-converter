import JSZip from 'jszip'

const zipFiles = (files: [string, Blob][]) =>
	files
		.reduce((zip, [name, blob]) => zip.file(name, blob), new JSZip())
		.generateAsync({type: 'blob'})

/** @note Downloads a single image file or a zip of all converted files. */
export const downloadFiles = async (files: [string, Blob][]) => {
	const [filename, blob] = files.length === 1 ? files[0] : ['images.zip', await zipFiles(files)]

	const url = URL.createObjectURL(blob)

	Object.assign(document.createElement('a'), {href: url, download: filename}).click()

	return void URL.revokeObjectURL(url)
}
