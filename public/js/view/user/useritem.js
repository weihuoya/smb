define(['underscore', 'jquery', 'backbone'], function(_, $, Backbone) {
  return Backbone.View.extend({
    initialize: function() { this.render() },
    template: _.template( $('#t-user-item').html() ),
    render: function() {
      this.setElement(this.template(this.model.toJSON()));
      //this.model.bind('change', this.render, this);
      this.model.bind('remove', this.remove, this);
      return this;
    }
  })
})