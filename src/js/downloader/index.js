import MetaDecoder from './meta-decoder'
import LoadFileAsArrayBuffer from './file-loader'
import { PNG } from "pngjs";
import mime from 'mime'

export {
    MetaDecoder,
    ImageDecoder,
    LoadFileAsArrayBuffer
}

export const ENCODE_NONE = 0 // 无编码
export const ENCODE_IMAGE = 1 // 图形编码

export const TYPE_URI = 0 // 下载链接
export const TYPE_STREAM = 1 // 原始数据

export const STATUS_CREATE = 0
export const STATUS_UPLOADING = 1
export const STATUS_FINISH = 2
export const STATUS_LOCAL = 3

export default class Downloader {

    constructor(config) {
        config = config || {}
        // 监听下载开始 
        this.onDownloadStart = config.start || config.onDownloadStart || function (meta) { console.log('onDownloadStart', meta) }
        // 监听下载结束
        this.onDownloadFinish = config.finish || function (d) { console.log('onDownloadFinish', d) }
        // 监听下载进度
        this.onDownloadProcess = config.process || function (i, max) { console.log('onDownloadProcess', i, max) }
        this.downloadTotal = 0
        this.downloadedBlocks = new Map()
        this.downloadCount = 0
        this.meta = {}
        this.limit = config.limit || 2;
    }

    parseDownload(source) {
        return this.parse(source).then(meta => this.download(meta))
    }

    parse(source) {
        return new Promise((resolve, reject) => {
            LoadFileAsArrayBuffer(source).then(metaData => {
                // 解析元数据
                new MetaDecoder(metaData).decode().then(meta => {
                    resolve(meta)
                }).catch(reject)
            }).catch(reject)
        });
    }

    download(meta) {
        return new Promise((resolve, reject) => {
            this.downloadLimit()
            // 初始话参数
            this.meta = meta
            this.downloadCount = 0
            this.downloadTotal = meta.block.length
            if (this.meta.status != STATUS_FINISH) {
                reject(new Error('Error Status'))
            }
            // 开始下载，提供元数据
            this.onDownloadStart(meta)
            this.downloadLimit(meta.block, this.limit).then(() => {
                let mimeType = mime.getType(meta.name)
                // 整合文件
                this.concatFile(mimeType).then(blob => {
                    resolve(blob)
                }).catch(reject)
            }).catch(reject)
        })
    }

    /**
     * 并发下载
     * 
     * @param {Array} blocks 
     * @param {Integer} limit 
     */
    downloadLimit(blocks, limit) {
        let process = (arr) => {
            let block = arr.shift()
            return this.downloadBlock(block).then(blockData => {
                this.downloadedBlocks.set(block.i, blockData)
                // console.log(block.i, blockData)
                this.onDownloadProcess(this.downloadCount, this.downloadTotal, block.i)
                this.downloadCount++
                if (arr.length > 0) {
                    return process(arr)
                }
                return this.downloadedBlocks
            })
        }
        let blockArr = [].concat(blocks)
        let work = [];
        while (limit-- > 0) {
            work.push(process(blockArr))
        }
        return Promise.all(work)
    }

    /**
     * 下载块
     * @param {Object} block 
     */
    downloadBlock(block) {
        return this.downloadBlockData(this.meta.type, this.meta.encode, block.d)
    }

    /**
     * 
     * @param {Integer} type 
     * @param {Integer} encode 
     * @param {Uint8Array} data 
     */
    downloadBlockData(type, encode, data) {
        // console.log(type, encode)
        if (type == TYPE_URI && encode == ENCODE_IMAGE) {
            return new Promise((resolve, reject) => {
                LoadFileAsArrayBuffer(this.uint8AsString(data)).then((dat) => {
                    new PNG().parse(dat, (error, png) => {
                        if (error == null) {
                            resolve(this.extractImageData(png.data))
                        } else {
                            reject(error)
                        }
                    });
                }).catch(reject)
            })
        }
        if (type == TYPE_URI && encode == ENCODE_NONE) {
            return new Promise((resolve, reject) => {
                LoadFileAsArrayBuffer(this.uint8AsString(data)).then((dat) => {
                    resolve(dat)
                }).catch(reject)
            })
        }
        if (type == TYPE_STREAM && encode == ENCODE_NONE) {
            return new Promise((resolve, reject) => {
                resolve(data)
            })
        }
        if (type == TYPE_STREAM && encode == ENCODE_IMAGE) {
            return new Promise((resolve, reject) => {
                new PNG().parse(dat, (error, png) => {
                    if (error == null) {
                        resolve(this.extractImageData(png.data))
                    } else {
                        reject(error)
                    }
                });
            })
        }
    }

    /**
     * 创建文件
     * 
     * @param {String} type 
     */
    concatFile(type) {
        return new Promise((resolve, reject) => {
            let blobs = [];
            for (var i = 0; i < this.downloadTotal; i++) {
                blobs.push(this.downloadedBlocks.get(i))
            }
            // 下载结束
            this.onDownloadFinish(blobs)
            // 整合文件
            resolve(new Blob(blobs, { 'type': type }))
        })
    }

    /**
     * 从RGBA数据解析成原始数据
     * 
     * @param {Uint8Array} data 
     */
    extractImageData(data) {
        let pos = 0;
        var b1 = data[pos++] << 24;
        var b2 = data[pos++] << 16;
        var b3 = data[pos++] << 8;
        var b4 = data[pos++];
        var version = b1 | b2 | b3 | b4;
        if (version !== 1) {
            throw new Error('image data version error')
        }
        b1 = data[pos++] << 24;
        b2 = data[pos++] << 16;
        b3 = data[pos++] << 8;
        b4 = data[pos++];
        var length = b1 | b2 | b3 | b4;
        var buf = new Uint8Array(length)
        for (var i = 0; i < length; i++) {
            buf[i] = data[pos++];
        }
        return buf
    }

    uint8AsString(data) {
        var str = ''
        for (var i = 0; i < data.length; i++) {
            str += String.fromCharCode(data[i]);
        }
        return new String(str);
    }
}

window.StorageDownloader = Downloader