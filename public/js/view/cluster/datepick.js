define(['backbone', 'datepicker', 'pnotify'], function() {
  return Backbone.View.extend({
    tagName: 'div',
    attributes: { 'class': 'date-pick' },
    events: {'click button': 'submit'},
    template: _.template( $('#t-datepick-view').html() ),
    initialize: function() { this.render() },
    render: function() {
      var start, end;
      this.$el.html( this.template() );
      start = this.$('#datepick-start input'), end = this.$('#datepick-end input');
      start = start.datepicker({format: 'yyyy-mm-dd'}).on('changeDate', function(e) { start.hide() }).data('datepicker');
      end = end.datepicker({format: 'yyyy-mm-dd'}).on('changeDate', function(e) { end.hide() }).data('datepicker');
      return this;
    },
    submit: function(e) {
      var self = this, start = this.$('#datepick-start input').val(), end = this.$('#datepick-end input').val();
      if(!start || !end || start === end) {
        $.pnotify({title: '注意', text: '请输入一个时间段，系统才能分析这个时间段内的微博数据！', type: 'notice', delay: 4000});
      } else {
        $.pnotify({title: '注意', text: '正在向系统提交微博分析请求……', type: 'notice', delay: 4000});
        $.getJSON('/analyze/cluster/'+start+'/'+end, function(data) {
          $.pnotify({title: '注意', text: '分析请求已经提交给系统处理，请稍后刷新页面查看结果！', type: 'success', delay: 4000});
        });
      }
    }
  })
})