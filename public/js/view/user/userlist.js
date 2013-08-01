define(['underscore', 'jquery', 'backbone', 'view/user/useritem'], function(_, $, Backbone, UserItemView) {
  return Backbone.View.extend({
    tagName: 'div',
    attributes: { 'class': 'user-list' },
    initialize: function() { this.render() },
    render: function() {
      this.collection.on('add', this.addItem, this);
      return this;
    },
    addItem: function(item) {
      var user;
      user = new UserItemView({model: item}),
      this.$el.append(user.$el);
    }
  })
})