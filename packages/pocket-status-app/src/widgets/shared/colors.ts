export type ColorPair = {background: string; foreground: string};
type ColorMap = Record<string, ColorPair>;

export const COLORS: ColorMap = {
    '0': {background: '#fff', foreground: '#444'},
    '1': {background: '#893E13', foreground: '#FDE6D4'},
    '2': {background: '#B95716', foreground: '#FFF0E5'},
    '3': {background: '#1F8039', foreground: '#E3F7E7'},
    '4': {background: '#315FBD', foreground: '#fff'},
    '5': {background: '#8b0d55', foreground: '#fed9ee'},
    '6': {background: '#27498a', foreground: '#E3D3FF'},
    '7': {background: '#068287', foreground: '#fff'},
    '8': {background: '#932530', foreground: '#ffebec'},
    '9': {background: '#C01173', foreground: '#FFDFF1'},
    '10': {background: '#208A3C', foreground: '#fff'},
    '11': {background: '#E56D17', foreground: '#351706'},
    '12': {background: '#E20F86', foreground: '#fff'},
    '13': {background: '#FFAF0F', foreground: '#523402'},
    '14': {background: '#89C398', foreground: '#2B3F2C'},
    '15': {background: '#B6E5E7', foreground: '#096a6e'},
    '16': {background: '#f7f8fa', foreground: '#27282e'},
    '17': {background: '#C0E3C8', foreground: '#1a5b2c'},
    '18': {background: '#FED277', foreground: '#734803'},
    '19': {background: '#F477BD', foreground: '#62073A'},
    '20': {background: '#DB3B4B', foreground: '#fff'},
    '21': {background: '#D0DFFC', foreground: '#27498A'},
    '22': {background: '#FCC3E2', foreground: '#C01173'},
    '23': {background: '#EBDCAB', foreground: '#514931'},
    '24': {background: '#7BCCCF', foreground: '#053537'},
    '25': {background: '#A2BEF8', foreground: '#203C72'},
    '26': {background: '#DBC482', foreground: '#514931'},
    '27': {background: '#C9CCD6', foreground: '#27282E'},
    '28': {background: '#039BA1', foreground: '#FFF'},
    '29': {background: '#3574F0', foreground: '#FFF'},
    '30': {background: '#818594', foreground: '#FFF'},
    '31': {background: '#494B57', foreground: '#fff'},
    '32': {background: '#1a5b2c', foreground: '#fff'},
    '33': {background: '#096a6e', foreground: '#daf4f5'},
    '34': {background: '#5d431d', foreground: '#FAECC0'},
    '35': {background: '#27282E', foreground: '#fff'},
};

export function getRandomColorPair(): ColorPair {
    const keys = Object.keys(COLORS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return COLORS[randomKey];
}