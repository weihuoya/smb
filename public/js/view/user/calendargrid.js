define(['underscore', 'jquery', 'backbone'], function(_, $, Backbone) {
  return Backbone.View.extend({
    tagName: 'div',
    attributes: { 'class': 'contrib-details grid' },
    template: _.template( $('#t-calender-grid').html() ),
    initialize: function() { this.render() },
    render: function() {
      this.$el.html( this.template(this.model.toJSON()) );
      this.model.on('change', this.render, this);
      return this;
    }
  })
})