require.config({
  baseUrl: 'js',
  paths: {
    'jquery': 'http://127.0.0.1:3000/js/lib/jquery.min',
    'underscore': 'http://127.0.0.1:3000/js/lib/underscore.min',
    'backbone': 'http://127.0.0.1:3000/js/lib/backbone.min',
    'd3': 'http://127.0.0.1:3000/js/lib/d3.min',
    'bootstrap': 'http://127.0.0.1:3000/js/lib/bootstrap.min',
    'datepicker': 'lib/datepicker.min',
    'pnotify': 'lib/jquery.pnotify.min'
  },
  shim: {
    'jquery': { exports: ['jQuery', '$'] },
    'bootstrap': ['jquery'],
    'datepicker': ['bootstrap'],
    'pnotify': ['jquery'],
    'underscore': { exports: '_' },
    'backbone': {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    'd3': { exports: 'd3' }
  }
})

require(['app', 'backbone', 'd3', 'bootstrap'], function(AppRouter) {
  var app = new AppRouter();
  Backbone.history.start();
  $.pnotify.defaults.history = false;
})



