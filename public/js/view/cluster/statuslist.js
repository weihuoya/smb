define(['underscore', 'jquery', 'backbone', 'd3', 'view/cluster/statusitem'], function(_, $, Backbone, d3, StatusItemView) {
  return Backbone.View.extend({
    tagName: 'div',
    attributes: { 'class': 'row-fluid' },
    initialize: function() {
      this.collection.on('add', this.addItem, this),
      this.render()
    },
    render: function() {
      return this;
    },
    addItem: function(item) {
      var status, format = d3.time.format("%Y-%m-%d"), user = item.get('user'), created_at = item.get('created_at');
      if(!user) item.set({user: {id: 0, screen_name: '', friends_count: 'N', followers_count: 'N', statuses_count: 'N'}});
      created_at = new Date(created_at), item.set({created_at: format(created_at)}),
      status = new StatusItemView({model: item}), this.$el.append(status.$el);
    }
  })
})