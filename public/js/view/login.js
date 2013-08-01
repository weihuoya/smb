define(['backbone'], function() {
  return Backbone.View.extend({
    tagName: 'div',
    attributes: { 'id': 'login', 'class': 'row-fluid' },
    template: _.template( $('#t-user-login').html() ),
    initialize: function() { this.render() },
    render: function() {
      this.$el.html( this.template() );
      return this;
    }
  })
})