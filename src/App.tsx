import {Component, For, createSignal, onMount} from 'solid-js'
import {FileUpload, useFileUpload} from '@ark-ui/solid/file-upload'
import {getSupportedFileFormats, IFormatSupport} from './lib'

import styles from './App.module.css'

type IColor = string
type IUuid = string
type IUrl = string
type IState = Record<
	IUuid,
	{
		id: IUuid
		src: IUrl
		size: number
		name: string
		type: IFormatSupport['mimeType']
		originalWidth: number
		originalHeight: number

		outputType: IFormatSupport['mimeType']
		outputWidth: number
		outputHeight: number

		backgroundColor?: IColor
		outputQuality?: number
	}
>

const App: Component = () => {
	const [supportedFormats, setSupportedFormats] = createSignal<IFormatSupport[]>([])
	const [state, setState] = createSignal<IState>({})

	const outputFormats = () =>
		supportedFormats()
			.filter(format => format.output)
			.map(format => format.name)

	const setOriginalResolution = (id: IUuid, width: number, height: number) =>
		void setState(state =>
			Object.assign({}, state, {
				[id]: Object.assign({}, state[id], {
					originalWidth: width,
					originalHeight: height,
					outputWidth: width,
					outputHeight: height,
				}),
			})
		)

	const fileUpload = useFileUpload({
		accept: supportedFormats()
			.filter(format => format.input)
			.map(format => format.mimeType),
		allowDrop: true,
		maxFiles: 99,
		onFileChange: async ({acceptedFiles: files}) => {
			if (!files.length) return
			const newState = await Promise.all(
				files.map(file => {
					const id = self.crypto.randomUUID()
					const src = URL.createObjectURL(file)

					new Promise<Event>((onload, onerror) =>
						Object.assign(document.createElement('img'), {onload, onerror, src})
					)
						.then(event => event.currentTarget! as HTMLImageElement)
						.then(image =>
							setOriginalResolution(id, image.naturalWidth, image.naturalHeight)
						)
						.catch(error => console.error(error))

					return {
						[id]: {
							id,
							name: file.name,
							src,
							type: file.type,
							originalWidth: 0,
							originalHeight: 0,
							ouptutType: 'image/jpeg',
							outputWidth: 0,
							outputHeight: 0,
						},
					}
				})
			)

			setState(Object.assign({}, state(), ...newState))
			fileUpload().clearFiles()
		},
	})

	onMount(async () => {
		setSupportedFormats(await getSupportedFileFormats())
	})

	const convert = async (id: IUuid) => {
		const {src, ...imageState} = state()[id]

		const image = await new Promise<Event>((onload, onerror) =>
			Object.assign(document.createElement('img'), {onload, onerror, src})
		).then(event => event.currentTarget as HTMLImageElement)

		const width = imageState.outputWidth
		const height = imageState.outputHeight

		const canvas = Object.assign(document.createElement('canvas'), {width, height})
		const context = canvas.getContext('2d')!

		if (imageState.backgroundColor) {
			context.fillStyle = imageState.backgroundColor
			context.fillRect(0, 0, width, height)
		}

		const sw = imageState.originalWidth
		const sh = imageState.originalHeight

		context.drawImage(image, 0, 0, sw, sh, 0, 0, width, height)

		// new Promise(callback => canvas.toBlob(callback, , quality)).then(blob=>{if (!blob) throw Erorr(); })
	}

	return (
		<div class={styles.App}>
			<FileUpload.RootProvider value={fileUpload}>
				<FileUpload.Label>File Upload</FileUpload.Label>
				<FileUpload.Dropzone>Drag your file(s) here</FileUpload.Dropzone>
				<FileUpload.Trigger>Choose file(s)</FileUpload.Trigger>
				<FileUpload.HiddenInput />
			</FileUpload.RootProvider>
			<ul>
				<For each={Object.values(state())}>
					{imageState => {
						const {id} = imageState

						return (
							<li>
								<button
									onclick={event => {
										event.preventDefault()
										setState(({[id]: _state2remove, ...newState}) => newState)
									}}
								>
									x
								</button>
								<img src={imageState.src} />
								{imageState.name}
								{imageState.size}
								{imageState.originalWidth}x{imageState.originalHeight}
								{imageState.type}
								{imageState.outputWidth}x{imageState.outputHeight}
								{/* dropdown that defaults to jpg */}
								<button disabled>convert</button>
							</li>
						)
					}}
				</For>
			</ul>
		</div>
	)
}

export default App
