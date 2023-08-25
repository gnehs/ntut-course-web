<template>
  <div class="share-preview">
    <div class="share-preview-content">
      <div class="share-preview-title">在通訊軟體上分享課程連結吧！</div>
      <p class="share-preview-description">
        我們驕傲呈獻精心打造的分享預覽，讓您輕鬆於通訊軟體上一睹課程風采。透過預覽，您將一覽課程名稱、教師、課程簡介等豐富資訊。
      </p>
      <button class="share-preview-button" @click="share">
        分享這個課程 <i class="bx bx-share"></i>
      </button>
    </div>
    <img src="/img/share-preview.png" class="share-preview-img" />
  </div>
</template>

<style>
.share-preview {
  display: flex;
  flex-direction: column-reverse;
  justify-content: center;
  align-items: center;
  margin: 16px 0;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 8px 16px;
  background-color: rgba(var(--text-color-value), 0.05);
  gap: 16px;
}
.share-preview-title {
  font-size: 24px;
  font-weight: bold;
}
.share-preview-img {
  width: 100%;
  max-width: 368px;
  border-radius: 8px;
}
.share-preview-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  & > i {
    transform: scaleX(-1);
  }
  &:hover {
    background-color: color-mix(in lch, var(--primary-color), white 20%);
  }
  &:active {
    background-color: color-mix(in lch, var(--primary-color), white 40%);
  }
}
@media screen and (min-width: 900px) {
  .share-preview-img {
    width: 256px;
  }
  .share-preview {
    flex-direction: row;
    padding-right: 8px;
  }
}
</style>
<script>
export default {
  methods: {
    share() {
      if (navigator.share) {
        navigator
          .share({
            url: location.href,
          })
          .then(() => console.log("Successful share"))
          .catch((error) => console.log("Error sharing", error));
      } else {
        alert("您的瀏覽器不支援分享功能，請手動複製網址。");
      }
    },
  },
};
</script>
