define(['underscore', 'jquery', 'backbone'], function(_, $, Backbone) {
  return Backbone.View.extend({
    tagName: 'div',
    events: {'click a': 'jump'},
    attributes: { 'class': 'navbar' },
    template: _.template( $('#t-analyze-paging').html() ),
    initialize: function() {
      this.model.on('change', this.render, this),
      this.render()
    },
    render: function() {
      this.$el.html( this.template(this.model.toJSON()) ),
      this.$('form').hide();
      return this;
    },
    jump: function(e) {
      var index, total, key1, key2, node, data = $(e.currentTarget).data('action'), type = data.charAt(0), action = data.charAt(1);
      if(type === 'p') {
        key1 = 'index', key2 = 'total', node = this.$('ul li').eq(6)
      } else if(type === 'c') {
        key1 = 'k', key2 = 'count', node = this.$('ul li').eq(2)
      }
      index = this.model.get(key1), total = this.model.get(key2);
      if(action === '-' && index > 1) {
        index -= 1;
        this.model.set(key1, index);
      } else if(action === '+' && index < total) {
        index += 1;
        this.model.set(key1, index);
      } else if(action === '=') {
        var self = this, input, page = node.find('a').hide(),
        form = node.find('form').show().submit(function(e) {
          var x = parseInt(input.val(), 10);
          if(!isNaN(x) && x <= total && x > 0 && x !== index) {
            self.model.set(key1, x);
          }
          return input.blur(), false;
        });
        input = form.find('input').val(index).focus().blur(function(e) { form.hide(), page.show() });
      }
    }
  })
})