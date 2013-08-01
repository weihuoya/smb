define(['backbone'], function() {
  return Backbone.View.extend({
    tagName: 'div',
    attributes: { 'class': 'row-fluid' },
    template: _.template( $('#t-about-view').html() ),
    initialize: function() { this.render() },
    render: function() {
      this.$el.html( this.template() );
      return this;
    }
  })
})