define(['backbone'], function() {
  return Backbone.View.extend({
    template: _.template( $('#t-subhead-view').html() ),
    initialize: function() { this.render() },
    render: function() {
      this.$el.html( this.template() );
      return this;
    }
  })
})