import loadSource from '../file-loader'
import { decode as Bdecode } from 'bencode'
import 'fast-text-encoding'

class MetaDecoder {

    constructor(meta) {
        this.meta = meta
    }

    decode() {
        return new Promise((resolve, reject) => {
            loadSource(this.meta).then(data => {
                this.metaInfo = Bdecode(this.xorDecode(data))
                this.metaInfo.name = this.uint8AsString(this.metaInfo.name)
                resolve(this.metaInfo)
            }).catch(reject)
        })
    }

    xorDecode(buf) {
        this.rawData = new Uint8Array(buf)
        // Magic/version/xor
        this.data = new Uint8Array(new ArrayBuffer(this.rawData.length - 6))
        this.magic = ''
        for (var i = 0; i < 4; i++) {
            this.magic += String.fromCharCode(this.rawData[i]);
        }
        if (this.magic != '\x14SMF') {
            throw new Error('meta magic error')
        }
        this.version = this.rawData[4]
        this.xor = this.rawData[5]
        if (this.version != 1) {
            throw new Error('meta version error')
        }
        for (var i = 6, j = 0; i < this.rawData.length; j++, i++) {
            this.data[j] = this.rawData[i] ^ this.xor
        }
        return this.data
    }

    uint8AsString(data) {
        return new String(new TextDecoder().decode(data));
    }
}

export default MetaDecoder