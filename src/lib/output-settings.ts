import {EXTENSIONS, IExt} from './formats'

export type IColor = string
export type IOutputSettings = {
	/** @note new background color (empty string = transparent) */
	bg: IColor
	/** @note compression quality */
	cq: number
	ext: IExt
	height: number
	width: number
}

const DEFAULT_OUTPUT_SETTINGS: IOutputSettings = {
	bg: '#ffffff',
	cq: 0.7,
	ext: 'jpeg',
	height: 0,
	width: 0,
}

const urlParams2json = (url: string) => {
	const queryParams = new URLSearchParams(url)
	const params: Record<string, string> = {}

	for (const [key, value] of queryParams.entries()) params[key] = value

	return params
}

/** @returns a number within the bounds */
const clamp = (min: number, max: number, value: number) => Math.min(Math.max(value, min), max)

const getAvalue = <T>(allowedValues: T[], defualtValue: T, unknownValue: any): T =>
	allowedValues.includes(unknownValue) ? (unknownValue as T) : defualtValue

const getInt = (defaultValue: number, value = '') => (value && parseInt(value)) || defaultValue
const getFloat = (defaultValue: number, value = '') => (value && parseFloat(value)) || defaultValue

export const url2outputSettings = (url: string): IOutputSettings => {
	/** @note no validation for bg as all invalid colors will be treated as black? */
	const {bg = DEFAULT_OUTPUT_SETTINGS.bg, ...params} = urlParams2json(url)

	const cq = clamp(0.01, 1, getFloat(DEFAULT_OUTPUT_SETTINGS.cq, params.cq))
	const height = Math.max(getInt(DEFAULT_OUTPUT_SETTINGS.height, params.height), 0)
	const width = Math.max(getInt(DEFAULT_OUTPUT_SETTINGS.width, params.width), 0)

	const ext = getAvalue(EXTENSIONS, DEFAULT_OUTPUT_SETTINGS.ext, params.ext)

	return {bg, cq, ext, height, width}
}
