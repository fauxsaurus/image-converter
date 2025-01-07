import {Component, createSignal, onMount} from 'solid-js'
import {getSupportedFileFormats, IFormatSupport} from './lib'

import logo from './logo.svg'
import styles from './App.module.css'

const App: Component = () => {
	const [supportedFormats, setSupportedFormats] = createSignal([] as IFormatSupport[])

	onMount(async () => {
		setSupportedFormats(await getSupportedFileFormats())
	})

	return <div class={styles.App}></div>
}

export default App
