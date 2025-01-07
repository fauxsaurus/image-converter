import {Component, For, createSignal, onMount} from 'solid-js'
import {FileUpload} from '@ark-ui/solid/file-upload'
import {getSupportedFileFormats, IFormatSupport} from './lib'

import styles from './App.module.css'

const App: Component = () => {
	const [supportedFormats, setSupportedFormats] = createSignal([] as IFormatSupport[])

	onMount(async () => {
		setSupportedFormats(await getSupportedFileFormats())
	})

	return (
		<div class={styles.App}>
			<FileUpload.Root
				accept={supportedFormats()
					.filter(format => format.input)
					.map(format => format.type)}
				allowDrop={true}
				maxFiles={99}
			>
				<FileUpload.Label>File Upload</FileUpload.Label>
				<FileUpload.Dropzone>Drag your file(s) here</FileUpload.Dropzone>
				<FileUpload.Trigger>Choose file(s)</FileUpload.Trigger>
				<FileUpload.ItemGroup>
					<FileUpload.Context>
						{context => (
							<For each={context().acceptedFiles}>
								{file => (
									<FileUpload.Item file={file}>
										<FileUpload.ItemPreview type="image/*">
											<FileUpload.ItemPreviewImage />
										</FileUpload.ItemPreview>
										<FileUpload.ItemPreview type=".*">
											Any Icon
										</FileUpload.ItemPreview>
										<FileUpload.ItemName />
										<FileUpload.ItemSizeText />
										<FileUpload.ItemDeleteTrigger>
											X
										</FileUpload.ItemDeleteTrigger>
									</FileUpload.Item>
								)}
							</For>
						)}
					</FileUpload.Context>
				</FileUpload.ItemGroup>
				<FileUpload.HiddenInput />
			</FileUpload.Root>
		</div>
	)
}

export default App
