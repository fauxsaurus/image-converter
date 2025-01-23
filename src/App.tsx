import {Component, For, createSignal, onMount} from 'solid-js'
import {FileUpload, useFileUpload} from '@ark-ui/solid/file-upload'
import {
	formatMetadata,
	getSupportedFileFormats,
	IExt,
	IFormatSupport,
	IOutputSettings,
	url2outputSettings,
} from './lib/'
import styles from './App.module.css'

const downloadFiles = (blobs: Record<string, Blob>) => {
	const files = Object.entries(blobs)
	if (files.length === 1) {
		const [filename, blob] = files[0]
		const url = URL.createObjectURL(blob)

		Object.assign(document.createElement('a'), {href: url, download: filename}).click()

		return void URL.revokeObjectURL(url)
	}

	/** @todo client-side JS code to downlaod multiple files as a zip */
}

const convert = async (output: IOutputSettings, file: File) => {
	/** @note this is an 80/20 line of code that will alter the base name of an extenionless file that used dots to spearate parts (e.g., file.name = '2025.01.23.13.07') */
	const newFileName = file.name.split('.').slice(0, -1).join('.') + `.${output.ext}`

	// LOAD IMAGE
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

	// SETUP CANVAS
	const canvas = Object.assign(document.createElement('canvas'), {width: ow, height: oh})
	const context = canvas.getContext('2d')!

	// DRAW
	if (output.bg) Object.assign(context, {fillStyle: output.bg}).fillRect(0, 0, ow, oh)
	context.drawImage(img, 0, 0, iw, ih, 0, 0, ow, oh)

	// OUTPUT FILE
	return (
		new Promise<Blob | null>(callback =>
			canvas.toBlob(callback, formatMetadata[output.ext].mimeType, output.cq)
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

/** @todo allow transparent formats to change their background color with bg (in this case default to white if set to '' on jpeg) */
/** @todo use https://web.dev/articles/offscreen-canvas to unlock better perfomance on the main thread (using it as a fallback in case it is not supported since the APIs are the same) */
const App: Component = () => {
	const [supportedFormats, setSupportedFormats] = createSignal<IFormatSupport[]>([])
	const [outputSettings, setOutputSettings] = createSignal(
		url2outputSettings(window.location.search)
	)

	const adjustOuputSetting = (newProp: Partial<IOutputSettings>) =>
		setOutputSettings(Object.assign({}, outputSettings(), newProp))

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
			<select
				value="jpeg"
				onchange={event =>
					adjustOuputSetting({
						ext: event.target.value as IExt,
					})
				}
			>
				<For each={supportedFormats()}>
					{format => (
						<option
							disabled={!format.output}
							selected={format.ext === outputSettings().ext}
						>
							{format.ext}
						</option>
					)}
				</For>
			</select>
			{supportedFormats().map(format => (
				<li>
					<Support value={format.input} />
					{format.ext}
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
				value={outputSettings().width}
				onInput={event =>
					adjustOuputSetting({
						width: event.target.valueAsNumber,
					})
				}
			/>{' '}
			x{' '}
			<input
				type="number"
				min="0"
				value={outputSettings().height}
				onInput={event =>
					adjustOuputSetting({
						height: event.target.valueAsNumber,
					})
				}
			/>
			<br />
			{/* @ts-ignore it is fine to access a potentially non-existent property here */}
			{!!formatMetadata[outputSettings().ext]?.compressible && (
				<label>
					Compression Quality{' '}
					<input
						type="number"
						max="1"
						min="0.01"
						value={outputSettings().cq}
						onInput={event =>
							adjustOuputSetting({
								cq: event.target.valueAsNumber,
							})
						}
					/>
				</label>
			)}
			{/* @todo make this work even if the format supports transparency */}
			{/* @todo white, black, custom */}
			{/* @ts-ignore it is fine to access a potentially non-existent property here */}
			{!formatMetadata[outputSettings().ext]?.transparency && (
				<label>
					Transparency Not Supported. Fallback background Color{' '}
					<input
						onchange={event => adjustOuputSetting({bg: event.currentTarget.value})}
						type="color"
						value={outputSettings().bg}
					/>
				</label>
			)}
		</div>
	)
}

export default App
