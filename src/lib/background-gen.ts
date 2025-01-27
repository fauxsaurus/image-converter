export const ext2svgIconString = (ext: string, color: string) =>
	`<svg height="1000" width="1000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
		<style>
			text {
				font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
				font-size: 120px;
				font-weight: bold;
			}
		</style>
		<defs>
			<mask id="text">
				<rect x="0" y="0" width="1000" height="1000" fill="#fff" />
				<text text-anchor="middle" x="50%" y="760">${ext.toLocaleUpperCase()}</text>
			</mask>
			<mask id="neck">
				<rect x="0" y="0" width="1000" height="1000" fill="#fff" />
				<circle cx="50%" cy="375" r="120" fill="#000" />
			</mask>
		</defs>
		<g id="icon" transform="scale(1.4,1.4) translate(-150,-150)">
			<!--file outline-->
			<path
				d="m375,200 350,0 0,600 -450,0 0,-500 100,-100 0,100 -100,0z"
				fill="none"
				stroke="${color}"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="35"
			/>
			<g fill="${color}">
				<!--tucked in corner-->
				<path d="m375,200 0,100 -100,0z" />
				<!--head and shoulders-->
				<circle cx="50%" cy="375" r="100" />
				<path d="m 350 575 a 45 45 0 0 1 300 0z" mask="url(#neck)" />
				<!--extension label-->
				<rect x="275" y="610" width="450" height="190" mask="url(#text)" />
			</g>
		</g>
	</svg>`

/** @note adapted from: https://github.com/yoksel/url-encoder/ */
export const svgText2cssBg = (svg: string) =>
	`url('data:image/svg+xml,${svg
		.replace(/>\s{1,}</g, `><`)
		.replace(/\s{2,}/g, ` `)
		.replace(/[\r\n%#()<>?[\\\]^`{|}]/g, encodeURIComponent)}')`

export const exts2cssBg = (exts: string[]) => {
	const positions = [
		[2.5, 95],
		[85, 35],
		[97.5, 97.5],
		[95, 5],
		[90, 70],
		[31.5, 100],
		[75, 95],
		[55, 90],
	]

	const colors = ['#ccc', '#fcc', '#fcc', '#ccc']

	return exts
		.map((ext, i) => {
			const [x, y] = positions[i]
			const color = colors[i % colors.length]
			const bgImage = svgText2cssBg(ext2svgIconString(ext, color))

			const bgPosition = `${x}% ${y}%`

			const size = i % 2 ? 12.5 : 10
			const bgSize = `${size}vmin auto`

			return [bgImage, [bgPosition, bgSize].join(' / '), 'no-repeat'].join(' ')
		})
		.join(', ')
}
