define(['underscore', 'jquery', 'backbone', 'd3'], function(_, $, Backbone, d3) {
  return Backbone.View.extend({
    tagName: 'li',
    template: _.template( $('#t-record-item').html() ),
    initialize: function() { this.render() },
    render: function() {
      var text, format = d3.time.format("%Y-%m-%d"), id = this.model.get('id'), 
      date_start = this.model.get('date_start'), date_end = this.model.get('date_end');
      
      date_start = new Date(date_start), date_end = new Date(date_end), 
      text = format(date_start) + ' 到 ' + format(date_end),
      this.$el.html(this.template({id: id, record: text})),
      //this.model.bind('change', this.render, this);
      this.model.bind('remove', this.remove, this);
      return this;
    }
  })
})