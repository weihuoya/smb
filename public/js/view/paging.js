define(['backbone'], function() {
  return Backbone.View.extend({
    tagName: 'div',
    events: {'click a': 'jump'},
    attributes: { 'class': 'pagination' },
    template: _.template( $('#t-paging-view').html() ),
    initialize: function() {
      this.model.on('change:index', this.change, this),
      this.model.on('change:total', this.change, this),
      this.render();
    },
    render: function() {
      this.$el.html(this.template()),
      this.change();
      return this;
    },
    change: function(e, model, value, options) {
      var node = this.$('ul li'), index = this.model.get('index'), total = this.model.get('total');
      node.eq(0).toggleClass('disabled', index === 1);
      node.eq(1).children('form').hide();
      node.eq(1).children('a').text(index+'/'+total).show();
      node.eq(2).toggleClass('disabled', index === total);
    },
    jump: function(e) {
      var index = this.model.get('index'), total = this.model.get('total'), action = $(e.currentTarget).data('action');
      if(action === '-' && index > 1) {
        index -= 1;
        this.model.set('index', index);
      } else if(action === '+' && index < total) {
        index += 1;
        this.model.set('index', index);
      } else if(action === '=') {
        var self = this, input, node = this.$('li.active'), page = node.find('a').hide(),
        form = node.find('form').show().submit(function(e) {
          var x = parseInt(input.val(), 10);
          if(!isNaN(x) && x <= total && x > 0 && x !== index) {
            self.model.set('index', x);
          }
          return input.blur(), false;
        });
        input = form.find('input').val(index).focus().blur(function(e) { form.hide(), page.show() });
      }
    }
  })
})