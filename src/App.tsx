import {Component, For, createSignal, onMount} from 'solid-js'
import {FileUpload, useFileUpload} from '@ark-ui/solid/file-upload'
import {getSupportedFileFormats, IFormatSupport} from './lib'

import styles from './App.module.css'

type IColor = string
type IOutputSettings = {
	bg: IColor
	compressionQuality: number
	extension: string
	height: number
	mimeType: string
	width: number
}

const downloadFiles = (blobs: Record<string, Blob>) => {
	const files = Object.entries(blobs)
	if (files.length === 1) {
		const [filename, blob] = files[0]
		const url = URL.createObjectURL(blob)

		Object.assign(document.createElement('a'), {href: url, download: filename}).click()

		return void URL.revokeObjectURL(url)
	}
}

const convert = async (output: IOutputSettings, file: File) => {
	/** @note this is an 80/20 line of code that will alter the base name of an extenionless file that used dots to spearate parts (e.g., file.name = '2025.01.23.13.07') */
	const newFileName = file.name.split('.').slice(0, -1).join('.') + `.${output.extension}`

	const src = URL.createObjectURL(file)
	const img = await new Promise<Event>((onload, onerror) =>
		Object.assign(document.createElement('img'), {onload, onerror, src})
	).then(event => event.currentTarget! as HTMLImageElement)
	/** @todo add an error catcher and short circuit the function */

	// input resolution
	const iw = img.naturalWidth
	const ih = img.naturalHeight
	// ouput resolution
	const ow = output.width || iw
	const oh = output.height || ih

	const canvas = Object.assign(document.createElement('canvas'), {width: ow, height: oh})
	const context = canvas.getContext('2d')!

	if (output.bg) Object.assign(context, {fillStyle: output.bg}).fillRect(0, 0, ow, oh)
	context.drawImage(img, 0, 0, iw, ih, 0, 0, ow, oh)

	return (
		new Promise<Blob | null>(callback =>
			canvas.toBlob(callback, output.mimeType, output.compressionQuality)
		)
			.then(blob => {
				/** @todo do something here */
				if (!blob) throw new Error('')

				return {[newFileName]: blob}
			})
			/** @tood catch security error, bitmap not origin clean https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob#exceptions */
			.finally(() => void URL.revokeObjectURL(src))
	)
}

const Support = ({value}: {value: boolean}) => (
	<span class="format-support" data-value={value}>
		{value ? '✔' : '✘'}
	</span>
)

/** @todo use https://web.dev/articles/offscreen-canvas to unlock better perfomance on the main thread (using it as a fallback in case it is not supported since the APIs are the same) */
const App: Component = () => {
	const [supportedFormats, setSupportedFormats] = createSignal<IFormatSupport[]>([])

	/** @todo add code to derrive all these from URL params with the given defaults */
	const [outputFormat, setOuputFormat] = createSignal('jpeg')
	const [outputHeight, setOutputHeight] = createSignal(0)
	const [outputWidth, setOutputWidth] = createSignal(0)
	const [outputCompressionQuality, setOutputCompressionQuality] = createSignal(0.7)
	const [outputFallbackBgColor, setOutputFallbackBgColor] = createSignal('#ffffff')

	const outputFormatMetadata = () =>
		supportedFormats().find(format => format.extension === outputFormat())!

	const outputSettings = () => ({
		bg: outputFallbackBgColor(),
		compressionQuality: outputCompressionQuality(),
		extension: outputFormatMetadata().extension,
		height: outputHeight(),
		mimeType: outputFormatMetadata().mimeType,
		width: outputWidth(),
	})

	const fileUpload = useFileUpload({
		accept: supportedFormats()
			.filter(format => format.input)
			.map(format => format.mimeType),
		allowDrop: true,
		maxFiles: 99,
		onFileChange: async ({acceptedFiles: files}) => {
			if (!files.length) return
			fileUpload().clearFiles()

			/** @todo support multiple files */

			downloadFiles(await convert(outputSettings(), files[0]))
		},
	})

	onMount(async () => {
		setSupportedFormats(await getSupportedFileFormats())
	})

	/** @todo add a progress bar to this process */

	return (
		<div class={styles.App}>
			<FileUpload.RootProvider value={fileUpload}>
				<FileUpload.Label>File Upload</FileUpload.Label>
				<FileUpload.Dropzone>Drag your file(s) here</FileUpload.Dropzone>
				<FileUpload.Trigger>Choose file(s)</FileUpload.Trigger>
				<FileUpload.HiddenInput />
			</FileUpload.RootProvider>
			Output Format
			<select value="jpeg" onchange={event => setOuputFormat(event.target.value)}>
				<For each={supportedFormats()}>
					{format => (
						<option
							disabled={!format.output}
							selected={format.extension === outputFormat()}
						>
							{format.extension}
						</option>
					)}
				</For>
			</select>
			{supportedFormats().map(format => (
				<li>
					<Support value={format.input} />
					{format.extension}
					<Support value={format.output} />
				</li>
			))}
			<span>
				Note: If the values below are set to zero, the output resolution will default to the
				input images' resolution.
			</span>{' '}
			<br />
			<input
				type="number"
				min="0"
				value={outputWidth()}
				onInput={event => setOutputWidth(event.target.valueAsNumber)}
			/>{' '}
			x{' '}
			<input
				type="number"
				min="0"
				value={outputHeight()}
				onInput={event => setOutputHeight(event.target.valueAsNumber)}
			/>
			<br />
			{outputFormatMetadata()?.compressible && (
				<label>
					Compression Quality{' '}
					<input
						type="number"
						max="1"
						min="0.01"
						value={outputCompressionQuality()}
						onInput={event => setOutputCompressionQuality(event.target.valueAsNumber)}
					/>
				</label>
			)}
			{/* @todo white, black, custom */}
			{!outputFormatMetadata()?.transparency && (
				<label>
					Transparency Not Supported. Fallback background Color{' '}
					<input
						onchange={event => setOutputFallbackBgColor(event.currentTarget.value)}
						type="color"
						value={outputFallbackBgColor()}
					/>
				</label>
			)}
		</div>
	)
}

export default App
