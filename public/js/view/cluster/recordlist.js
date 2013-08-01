define(['underscore', 'jquery', 'backbone', 'view/cluster/recorditem'], function(_, $, Backbone, RecordItemView) {
  return Backbone.View.extend({
    tagName: 'ul',
    attributes: { 'class': 'nav nav-list' },
    initialize: function() { this.render() },
    render: function() {
      this.$el.html('<li class="nav-header">已分析的时间段</li>');
      this.collection.on('add', this.addItem, this);
      return this;
    },
    addItem: function(item) {
      var record;
      record = new RecordItemView({model: item}),
      this.$el.append(record.$el);
    }
  })
})