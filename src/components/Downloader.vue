<template>
  <div>
    <div class="main">
      <div class="logo">Go Storage downloader</div>
      <div class="container">
        <button class="selectBtn" id="selectBtn" @click="select">选择Meta文件</button>
        <input type="file" id="select" @change="fileChange" hidden />
      </div>
      <div class="meta-info" v-if="metaData != null">
        <div class="info-row">
          <div class="info-name">文件名</div>
          <div class="info-value">{{metaData.name}}</div>
        </div>
        <div class="info-row">
          <div class="info-name">文件大小</div>
          <div class="info-value">{{size}}</div>
        </div>
        <div class="info-row">
          <div class="info-name">文件块数量</div>
          <div class="info-value">{{metaData.block.length}}</div>
        </div>
      </div>
      <div class="process">
        <div class="text" v-for="item in processText" v-bind:key="item.id">{{ item.text }}</div>
      </div>
      <div>
        <a :href="download" class="btn-download" v-if="download.length > 0">保存到本地</a>
      </div>
      <div class="bottom">
        <a href="https://github.com/dxkite/go-storage-web">Github Source</a>
        <a href="https://github.com/dxkite/go-storage">Client</a>
      </div>
    </div>
  </div>
</template>

<script>
import Downloader from "@/js/downloader";
import formatSize from "@/js/util/formatSize";

export default {
  name: "Downloader",
  data() {
    return {
      metaData: null,
      size: "0kb",
      download: "",
      name: "",
      processText: []
    };
  },
  methods: {
    select: function() {
      document.getElementById("select").click();
    },
    fileChange: function(file) {
      let files = document.getElementById("select").files;
      if (files.length > 0) {
        new Downloader({
          start: meta => {
            this.metaData = meta;
            this.size = formatSize(meta.size);
          },
          process: (i, total, index) => {
            this.processText.push({
              id: i,
              text: "第" + index + "块，下载成功"
            });
          },
          finish: () => {
            this.processText.push({
              id: this.processText.length,
              text: "下载完成，组装文件中"
            });
          }
        })
          .parseDownload(files[0])
          .then(file => {
            this.download = URL.createObjectURL(file);
          })
          .catch(e => {
            this.processText.push({
              id: this.processText.length,
              text: "下载文件失败:" + e
            });
          });
      }
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.main {
  text-align: center;
  padding: 2em;
}
.logo {
  padding: 1em;
  background-color: rgb(66, 133, 244);
  color: white;
  display: inline-block;
  text-align: center;
  font-size: 1.5em;
}

.meta-info {
  margin: 1em;
}

.info-row {
  display: flex;
  justify-content: center;
}

.info-name {
  padding-right: 1em;
}

.selectBtn {
  display: inline-block;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  background: #fff;
  border: 1px solid #dcdfe6;
  color: #606266;
  -webkit-appearance: none;
  text-align: center;
  box-sizing: border-box;
  outline: none;
  margin: 0;
  transition: 0.1s;
  font-weight: 500;
  user-select: none;
  padding: 12px 20px;
  font-size: 14px;
  border-radius: 4px;
}

.btn-download {
  color: #fff;
  background-color: #67c23a;
  border-color: #67c23a;
  display: inline-block;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  -webkit-appearance: none;
  text-align: center;
  box-sizing: border-box;
  outline: none;
  margin: 0;
  transition: 0.1s;
  font-weight: 500;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  padding: 12px 20px;
  font-size: 14px;
  border-radius: 4px;
  text-decoration: none;
}

.container,
.process {
  padding: 1em;
}
.bottom {
  text-align: center;
}

.bottom a {
  color: #666;
  text-decoration: none;
}
</style>
