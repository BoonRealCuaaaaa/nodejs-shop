import * as url from 'url';

let rootDir = url.fileURLToPath(new URL('.', import.meta.url));
rootDir+='../'
export default rootDir