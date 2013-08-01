define(['underscore', 'jquery', 'backbone'], function(_, $, Backbone) {
  return Backbone.View.extend({
    template: _.template( $('#t-collection-view').html() ),
    initialize: function() { this.render() },
    render: function() {
      this.setElement(this.template(this.model.toJSON()));
      //this.model.bind('change', this.render, this);
      this.model.bind('remove', this.remove, this);
      return this;
    }
  })
})