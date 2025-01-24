import {Component, For, createSignal, onMount} from 'solid-js'
import {FileUpload, useFileUpload} from '@ark-ui/solid/file-upload'
import {
	downloadFiles,
	formatMetadata,
	getSupportedFileFormats,
	IExt,
	IFormatSupport,
	IOutputSettings,
	url2outputSettings,
} from './lib/'
import styles from './App.module.css'
import {ColorSelection} from './color-select'

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

	// DRAW IMAGE
	const canvas = Object.assign(document.createElement('canvas'), {width: ow, height: oh})
	const context = canvas.getContext('2d')!

	if (output.bg !== 'transparent')
		Object.assign(context, {fillStyle: output.bg}).fillRect(0, 0, ow, oh)
	context.drawImage(img, 0, 0, iw, ih, 0, 0, ow, oh)

	// OUTPUT IMAGE
	return (
		new Promise<Blob | null>(callback =>
			canvas.toBlob(callback, formatMetadata[output.ext].mimeType, output.cq)
		)
			.then(blob => {
				/** @todo do something here */
				if (!blob) throw new Error('')

				return [newFileName, blob] as [string, Blob]
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

			const actingOutputSettings = Object.assign({}, outputSettings(), {bg: actingBg()})

			await downloadFiles(
				await Promise.all(files.map(file => convert(actingOutputSettings, file)))
			)
		},
	})

	// @ts-ignore yes, we can check if the transparency property exists
	const allowsTransparency = () => !!formatMetadata[outputSettings().ext]?.transparency
	/** @note the fallback color to use if a transparent background is selected but not allowed */
	const actingBg = () => {
		const setColor = outputSettings().bg
		if (allowsTransparency() || setColor !== 'transparent') return setColor
		return '#ffffff'
	}

	onMount(async () => {
		setSupportedFormats(await getSupportedFileFormats())
	})

	/** @todo expand the drag and drop area, center the file button (vertically/horizontally), add colored checkmarks, improve the resolution layout bit, improve compression quality with a tooltip, improve the backgrond color layout, sizing, color swatches, and make a clear indicator of an editable/custom color */

	/** @todo add error handling to all the async functions used */
	/** @todo +Privacy First Notice and intuative instructions with good SEO */
	/** @todo add a spanish localization */
	return (
		<div class={styles.App}>
			<FileUpload.RootProvider value={fileUpload}>
				<FileUpload.Dropzone>
					{/* !mobile && Drag and Drop  */}
					<FileUpload.Trigger>Choose Images(s)</FileUpload.Trigger>
				</FileUpload.Dropzone>
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
			Background Color
			{/* @todo support alpha channels on bg colors */}
			<ColorSelection
				disableTransparency={!allowsTransparency()}
				defaultValue="#cc3333"
				onchange={bg => adjustOuputSetting({bg})}
				value={actingBg()}
			/>
			{!allowsTransparency() &&
				`Note: ${outputSettings().ext} files do not support transparency.`}
		</div>
	)
}

export default App
