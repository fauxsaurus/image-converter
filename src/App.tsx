import {Component, For, createSignal, onMount} from 'solid-js'
import {FileUpload, useFileUpload} from '@ark-ui/solid/file-upload'
import {
	downloadFiles,
	exts2cssBg,
	formatMetadata,
	getSupportedFileFormats,
	IExt,
	IFormatSupport,
	IOutputSettings,
	url2outputSettings,
} from './lib/'
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

	const iconBg = () =>
		exts2cssBg(
			supportedFormats()
				.filter(format => format.input)
				.map(format => format.ext)
		)

	onMount(async () => void setSupportedFormats(await getSupportedFileFormats()))

	/** @todo improve the convert to dropdown, put the label over the button (left aligned) and absolutely position them over the dropzone */
	/** @todo  improve the resolution layout bit, improve compression quality with a tooltip, improve the backgrond color layout, sizing, color swatches, and make a clear indicator of an editable/custom color */
	/** @todo add drag and drop hover styles*/
	/** @todo check accessibility on the image conversion (e.g., what file formats are supported? And do screen readers conveniently convey that?) */
	/** @todo add error handling to all the async functions used */
	/** @todo +Privacy First Notice and intuative instructions with good SEO */
	/** @todo add spanish localization */
	return (
		<>
			<header>
				<h1>Image Converter</h1>
			</header>
			<aside>
				<fieldset>
					<legend>Output Resolution</legend>
					<div class="row">
						<label>
							Width
							<input
								placeholder="auto"
								type="number"
								min="0"
								value={outputSettings().width || undefined}
								onInput={event =>
									adjustOuputSetting({width: event.target.valueAsNumber})
								}
							/>
						</label>
						x
						<label>
							Height
							<input
								placeholder="auto"
								type="number"
								min="0"
								value={outputSettings().height || undefined}
								onInput={event =>
									adjustOuputSetting({height: event.target.valueAsNumber})
								}
							/>
						</label>
						px
					</div>
				</fieldset>
				<fieldset>
					{/* @todo add tooltips here to indicate that this just replaces transparent pixels with the chosen bg color. */}
					<legend>Background Color</legend>
					{/* @todo support alpha channels on bg colors */}
					<ColorSelection
						disableTransparency={!allowsTransparency()}
						defaultValue="#ff3333"
						onchange={bg => adjustOuputSetting({bg})}
						value={actingBg()}
					/>
					{!allowsTransparency() && (
						<div class="notice">{`Note: ${outputSettings().ext.toLocaleUpperCase()} files do not support transparency.`}</div>
					)}
				</fieldset>
				{/* @ts-ignore it is fine to access a potentially non-existent property here */}
				{!!formatMetadata[outputSettings().ext]?.compressible && (
					<fieldset>
						<legend>Compression Quality</legend>
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
					</fieldset>
				)}
			</aside>
			<style>{`[data-part="dropzone"]{background: ${iconBg()}}`}</style>
			<FileUpload.RootProvider value={fileUpload}>
				<FileUpload.Dropzone>
					{/* if mobile, make this text transparent */}
					<FileUpload.Label>Drag and Drop File(s)</FileUpload.Label>
					<FileUpload.Trigger>Choose Images(s)</FileUpload.Trigger>
					<div>
						<label for="output-format" onclick={event => event.stopPropagation()}>
							Convert To
							<select
								id="output-format"
								onclick={event => event.stopPropagation()}
								onchange={event =>
									adjustOuputSetting({ext: event.target.value as IExt})
								}
								value={outputSettings().ext}
							>
								<For each={supportedFormats().filter(format => format.output)}>
									{format => (
										<option selected={format.ext === outputSettings().ext}>
											{format.ext}
										</option>
									)}
								</For>
							</select>
						</label>
					</div>
				</FileUpload.Dropzone>
				<FileUpload.HiddenInput />
			</FileUpload.RootProvider>
		</>
	)
}

export default App
