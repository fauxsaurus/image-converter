type IProps = {
	/** @note the default value for the custom color */
	disableTransparency?: boolean
	defaultValue: string
	onchange: (newColor: string) => void
	value: string
}

const PRESETS = ['transparent', '#ffffff', '#000000']

export const ColorSelection = (props: IProps) => {
	const pickColor = (newColor: string) => (event: Event) => (
		event.preventDefault(), props.onchange(newColor)
	)

	const customColor = () => (PRESETS.includes(props.value) ? props.defaultValue : props.value)

	return (
		<div class="color-select-group">
			<button
				data-selected={props.value === PRESETS[0]}
				disabled={props.disableTransparency}
				onclick={pickColor(PRESETS[0])}
				style={{'--color-swatch': PRESETS[0]}}
			/>
			<button
				data-selected={props.value === PRESETS[1]}
				onclick={pickColor(PRESETS[1])}
				style={{'--color-swatch': PRESETS[1]}}
			/>
			<button
				data-selected={props.value === PRESETS[2]}
				onclick={pickColor(PRESETS[2])}
				style={{'--color-swatch': PRESETS[2]}}
			/>
			<label
				data-selected={props.value === customColor()}
				style={{'--color-swatch': customColor()}}
			>
				<input
					hidden
					// @note the onclick handler is included because if the user clicks it to toggle the value, but does not change it in the popup, the default color will still be used to update the ouput image's background color
					onclick={event => props.onchange(event.currentTarget.value)}
					onchange={event => props.onchange(event.currentTarget.value)}
					type="color"
					value={customColor()}
				/>
			</label>
		</div>
	)
}
