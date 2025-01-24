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
	//    display: block;
	//     height: 1rem;
	//     width: 2rem;
	// background-image: conic-graident(#333, 90deg, #999 90deg 10deg, #333 180deg, 270deg, #999 270deg);

	const customColor = () => (PRESETS.includes(props.value) ? props.defaultValue : props.value)

	return (
		<div class="color-select-group">
			<button disabled={props.disableTransparency} onclick={pickColor(PRESETS[0])}>
				<span class="color-swatch"></span>
			</button>
			<button onclick={pickColor(PRESETS[1])}>
				<span class="color-swatch"></span>
			</button>
			<button onclick={pickColor(PRESETS[2])}>
				<span class="color-swatch"></span>
			</button>
			{/* @todo try wrapping this in a label and hiding it to show a custom button more inline with the other styles/make it clear that that button is a custom button and not simply another toggle for a redish color */}
			<input
				// @note the onclick handler is included because if the user clicks it to toggle the value, but does not change it in the popup, the default color will still be used to update the ouput image's background color
				onclick={event => props.onchange(event.currentTarget.value)}
				onchange={event => props.onchange(event.currentTarget.value)}
				type="color"
				value={customColor()}
			/>
		</div>
	)
}
