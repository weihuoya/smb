define(['underscore', 'jquery', 'backbone', 'd3', 'view/user/calendar', 'view/user/calendargrid'], function(_, $, Backbone, d3, CalendarView, CalenderGridView) {
  return Backbone.View.extend({
    tagName: 'div',
    attributes: { 'class': 'capped-box' },
    events: { 'click #calendar-ctrl a': 'scroll' },
    template: _.template( $('#t-user-state').html() ),
    initialize: function() {
      this.gridModel = new Backbone.Model({max: 0, max_text: '', act: 0, act_text: '', mean: 0, mean_text: ''}),
      this.calendarView = new CalendarView(),
      this.calenderGridView = new CalenderGridView({model: this.gridModel}),
      this.render();
    },
    render: function() {
      this.$el.html( this.template() );
      this.$('div.contrib-header').after(this.calendarView.$el);
      this.$el.append(this.calenderGridView.$el);
    },
    show: function(data) {
      var format = d3.time.format('%Y-%m-%d'), stats = this.calendarView.show(data);
      this.gridModel.set({
        max: stats.max.value,
        max_text: 'Date: '+format(stats.max.date),
        act: stats.act.value,
        act_text: format(stats.act.begin)+' To '+format(stats.act.end),
        mean: stats.mean.value.toFixed(2),
        mean_text: 'Actived ' + stats.act.total + (stats.act.total>1?' days':' day')
      });
    },
    scroll: function(e) {
      var self = this, ctrl = $(e.currentTarget).data('ctrl');
      if(ctrl === '-') {
        self.calendarView.move(+320);
      } else if(ctrl === '+') {
        self.calendarView.move(-320);
      }
    }
  })
})