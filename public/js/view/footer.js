define(['backbone'], function() {
  return Backbone.View.extend({
    tagName: 'footer',
    initialize: function() { this.render() },
    render: function() {
      this.$el.html('<p>Developed by ZhangWei, 2013</p>');
      return this;
    }
  })
})