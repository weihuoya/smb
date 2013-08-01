define(['underscore', 'jquery', 'backbone', 'view/status/collection'], function(_, $, Backbone, CollectionView) {
  return Backbone.View.extend({
    tagName: 'table',
    attributes: { 'cellspacing': '0' },
    initialize: function() {
      this.collection.on('add', this.addItem, this),
      this.collection.on('sync', function(collection, resp, options) {
        this.$('tr td[rowspan]').filter(':even').each(function() {
          $(this).parent().css('background-color', '#f8f8f8').nextAll().slice(0, this.rowSpan-1).css('background-color', '#f8f8f8');
        });
      }, this),
      this.render();
    },
    render: function() {
      this.$el.html( $('#t-collection-header').html() );
      return this;
    },
    addItem: function(item) {
      var collection = new CollectionView({model: item});
      this.$el.append(collection.$el);
    }
  })
})