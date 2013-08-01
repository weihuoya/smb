define(['underscore', 'jquery', 'backbone'], function(_, $, Backbone) {
  return Backbone.View.extend({
    tagName: 'div',
    attributes: { 'class': 'row-fluid' },
    template: _.template($('#t-media-item').html()),
    initialize: function() { this.render() },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      //this.model.bind('change', this.render, this);
      this.model.bind('remove', this.remove, this);
      return this;
    }
  })
})