define(['underscore', 'jquery', 'backbone', 'view/status/databaselist', 'view/status/database'], function(_, $, Backbone, DatabaseListView, DatabaseView) {
  return Backbone.View.extend({
    tagName: 'div',
    attributes: { 'class': 'row-fluid' },
    events: { 'click .nav-list a' : 'stats' },
    initialize: function() {
      this.list = new Backbone.Collection(null, {url: '/status/database'});
      this.listView = new DatabaseListView({collection: this.list});
      
      this.database = new Backbone.Collection();
      this.databaseView = new DatabaseView({collection: this.database});
      
      this.render();
    },
    render: function() {
      var node = $('<div class="span3 well sidebar-nav"/><div class="span9"/>');
      this.$el.html(node);
      node.eq(0).append(this.listView.$el);
      node.eq(1).append(this.databaseView.$el);
      this.list.fetch();
      return this;
    },
    stats: function(e) {
      var type = $(e.currentTarget).data('type'),
      name = $(e.currentTarget).data('name'),
      key = '/status/'+type+'/'+name;
      this.database.fetch({url: key});
    }
  })
})