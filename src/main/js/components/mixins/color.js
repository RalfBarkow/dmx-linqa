import COLOR_PALETTE from '../../lq-color-palette'

/**
 * The host component is expected to hold
 * - topic      any topic which has a "color" child value
 */
export default {
  computed: {

    color () {
      const c = this.topic.children['linqa.color']?.value
      // Note: we read "color" from child value, not view property.
      // See comment on customizeTopic() in LinqaPlugin.java
      if (c) {
        return c
        // TODO: add default color config at canvas-level?
      } else if (this.topic.typeUri === 'linqa.line') {
        return COLOR_PALETTE.foreground[0]   // default is gray
      } else {
        return COLOR_PALETTE.background[1]   // default is light gray
      }
    },

    /**
     * Returns the color code in a form usable as a XML "id" attribute.
     */
    colorAsId () {
      return this.color.replace('#', '').replace('(', '-').replace(')', '').replaceAll(' ', '')
    }
  }
}
