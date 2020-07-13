import aixos from 'axios'

/**
 * 返回 Uint8Array
 * 
 * @param Uint8Array source 
 */
function Uint8Array(source) {
    return new Promise((resolve, reject) => {
        resolve(source)
    })
}

/**
 * 从Blob中读取 Uint8Array
 * 
 * @param Blob source 
 */
function Blob(source) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        reader.onload = function (evt) {
            resolve(evt.target.result)
        };
        reader.onerror = function (evt) {
            reject(reader.error);
            reader.abort();
        };
        reader.readAsArrayBuffer(source);
    })
}

/**
 * 从Blob中读取 Uint8Array
 * 
 * @param Blob source 
 */
function Url(source) {
    return new Promise((resolve, reject) => {
        aixos.get(source, {
            responseType: 'arraybuffer'
        }).then(resp => {
            resolve(resp.data)
        }).catch(err => {
            reject(err)
        })
    })
}

/**
 * 根据资源获取 Uint8Array 数据
 * 
 * @param {Uint8Array|File|Blob|String} source 
 */
export default function (source) {
    if (source instanceof Uint8Array || source instanceof ArrayBuffer) {
        return Uint8Array(source)
    }
    if (source instanceof Blob || source instanceof File) {
        return Blob(source)
    }
    if (source instanceof String) {
        return Url(source)
    }
    throw new Error('unknown source type')
}