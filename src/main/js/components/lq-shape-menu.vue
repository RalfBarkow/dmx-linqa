<template>
  <el-dropdown class="lq-shape-menu" trigger="click" @command="setShape">
    <span ref="trigger"></span>
    <template #dropdown>
      <el-dropdown-menu class="lq-shape-dropdown">
        <el-dropdown-item command="rectangle">
          <div class="rectangle" :style="backgroundColor"></div>
        </el-dropdown-item>
        <el-dropdown-item command="ellipse">
          <div class="ellipse" :style="backgroundColor"></div>
        </el-dropdown-item>
        <el-dropdown-item command="rectangle-outline" divided>
          <div class="rectangle-outline" :style="borderColor"></div>
        </el-dropdown-item>
        <el-dropdown-item command="ellipse-outline">
          <div class="ellipse-outline" :style="borderColor"></div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script>
import dmx from 'dmx-api'

export default {

  mixins: [
    require('./mixins/color-model').default
  ],

  props: {

    modelValue: {               // not used at the moment (for v-model)
      type: String,
      required: true
    },

    topic: {                    // the topic to provide the color for drawing the shape menu items
      type: dmx.ViewTopic,
      required: true
    }
  },

  methods: {

    setShape (shape) {
      this.$emit('update:modelValue', shape)
    },

    open () {
      this.$refs.trigger.click()
    }
  }
}
</script>

<style>
/* the actual dropdown menus are body mounted */

.lq-shape-dropdown .rectangle,
.lq-shape-dropdown .rectangle-outline {
  width: 36px;
  height: 27px;
  margin: 0 auto;
}

.lq-shape-dropdown .ellipse,
.lq-shape-dropdown .ellipse-outline {
  width: 40px;
  height: 30px;
  border-radius: 50%;
}

.lq-shape-dropdown .rectangle-outline,
.lq-shape-dropdown .ellipse-outline {
  box-sizing: border-box;
  border: 3px solid;
}
</style>
