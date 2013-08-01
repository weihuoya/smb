define(['underscore', 'jquery', 'backbone', 'view/status/databaseitem'], function(_, $, Backbone, DatabaseItemView) {
  return Backbone.View.extend({
    tagName: 'ul',
    attributes: { 'class': 'nav nav-list' },
    initialize: function() { this.render() },
    render: function() {
      this.$el.html('<li class="nav-header">MongoDB</li>');
      this.collection.on('add', this.addItem, this);
      return this;
    },
    addItem: function(item) {
      var database, size;
      size = item.get('sizeOnDisk'),
      item.set({'sizeOnDisk': size >> 20}),
      database = new DatabaseItemView({model: item}),
      this.$el.append(database.$el);
    }
  })
})