define(['underscore', 'jquery', 'backbone', 'd3'], function(_, $, Backbone, d3) {
  return Backbone.View.extend({
    cx: 0, cy: 0,
    tagName: 'div',
    attributes: { 'class': 'contrib-calendar' },
    initialize: function() {
      this.$el.css({'position': 'relative'});
      this.show();
    },
    show: function(data) {
      this.$el.children().detach();
      return this.calendar(data);
    },
    move: function(x) {
      if(this.cx < 20 || x < 0) {
        this.cx += x;
        d3.select("svg#calendar-graph g").transition().duration(1000).ease("quad-in-out").attr("transform", "translate("+this.cx+", "+this.cy+")");
      }
    },
    calendar: function(data) {
      var i, d, x, y, z, F, week, ext, sum, mdate, ib, ie, dc, begin, end, acount, dcount, is = 0, streak = 0, max = 0, mean = 0, delta, levels, counters = [], 
      k = 3.77972616981, day = 1000 * 60 * 60 * 24, colors = ["#d6e685", "#8cc665", "#44a340", "#1e6823"];
      data || (data = []), acount = i = data.length;
      
      if(i > 0) {
        ib = ie = mdate = begin = end = data[i-1][0] = new Date( data[i-1][0] );
        is = streak = mean = max = data[i-1][1], dc = dcount = 0;
        counters.push(max);
        
        //计算平均值，获取最长活动时间，补上没有数据的日期信息
        while(--i > 0) {
          ib = x = data[i][0], z = data[i][1], mean += z, counters.push(z);
          y = data[i-1][0], y = data[i-1][0] = new Date(y), d = (x.getTime() - y.getTime()) / day, d = parseInt(d, 10);
          
          if(d < 2) {
            dc += 1, is += z;
          } else {
            if(dc > dcount || (dc === dcount && streak < is) ) streak = is, dcount = dc, begin = ib, end = ie;
            dc = 1, ie = x, is = z;
          }
          
          while(--d > 0) data.push([new Date(y.getTime() + d * day), 0]);
          if(z > max) mdate = x, max = z;
        }
        
        i = data.length, mean /= i, sum = 0, week = data[0][0].getDay(), data.sort( function (x, y) { return d3.ascending(x[0], y[0]) } );
        while(week > 0) week -= 1, data.unshift([new Date(data[0][0].getTime() - day), 0]);
        
        //计算标准差
        while(--i >= 0) x = data[i][0], y = data[i][1], delta = y - mean, sum += delta * delta;
        d = Math.sqrt( sum / (data.length - 1) );
        
        //计算颜色分级
        i = 0, ext = (max - mean < 6 || max < 15) ? 1 : 3;
        while (i < ext) F = counters.filter(function (x) { var b; return b = Math.abs((mean - x) / d), b > k } ), F.length > 0 ? (F = F[0], counters = counters.filter(function (x) { return x !== F }), i === 0) : F = null, i += 1;
      }
      
      levels = d3.scale.quantile().domain([0, d3.max(counters)]).range(colors);
      this.draw(data, levels);
      return {max: {value: max, date: mdate}, act: {value: dcount, begin: begin, end: end, total: acount}, mean: {value: mean}};
    },
    draw: function(data, levels) {
      var G, W, D, tip, formater, ext, prv, epoch, self = this, wdata = {}, mdata = {}, cell = 12, padding = 2, offsetX = 20, offsetY = 20;
      this.cx = offsetX, this.cy = offsetY, tip = $('<div class="svg-tip" />').hide(), this.$el.append(tip);
      
      G = d3.select(this.el).append("svg").attr("id", "calendar-graph")
      .append("g").attr("transform", "translate(" + offsetX + ", " + offsetY + ")");

      //按年份和周数划分数据
      formater = d3.time.format("%Y%U"); //[1970-9999], [0, 53]
      data.forEach(function (x) { var b; return b = formater(x[0]), wdata[b] || (wdata[b] = []), wdata[b].push(x) });
      wdata = d3.entries(wdata);
      
      epoch = data.length > 0 ? data[0][0].getFullYear() : 0;
      W = G.selectAll("g.week").data(wdata).enter().append("g")
      .attr("transform", function (d, i) {
        var x = d.value[0][0];
        x = epoch - x.getFullYear();
        return "translate(" + (i + x) * cell + ", 0)"
      });
      
      formater = d3.time.format("%w"), //weekday, [0, 6]
      D = W.selectAll("rect.day").data(function (d) { return d.value } ).enter()
      .append("rect").attr("class", "day").attr("width", cell - padding).attr("height", cell - padding)
      .attr("y", function (d) { return formater(d[0]) * cell } )
      .style("fill", function (d) { return d[1] === 0 ? "#eee" : levels(d[1]) } )
      .on("click", function (d) { console.log('contributions:range:click: ', d) } )
      .on("mouseover", function(data, row, col) { //data 节点数据, row 行, col 列
        var width, height, pos, time=d3.time.format("%Y-%m-%d")(data[0]), text=data[1]===0?"No Status":data[1]+(data[1]>1?" Statuses":"Status");
        tip.html("<strong>"+text+"</strong> on "+time), width = tip.outerWidth(), height = tip.outerHeight();
        row+=1, col+=2-(data[0].getFullYear()-epoch), pos={top: (row*cell-height-4)+"px", left: (col*cell-width/2+1+self.cx-offsetX)+"px"};
        tip.css(pos).show();
      }).on("mouseout", function() { tip.hide() });

      D.append("title").text(function (d) {
        var a = d3.time.format("%Y-%m-%d"), a = a(d[0]), b = d[1], b = b === 0 ? "No Status" : b + (b > 1 ? " Statuses" : "Status");
        return b + " on " + a
      });
      
      //按年份和月份划分数据
      ext = 0;
      formater = d3.time.format("%m-%y"); //[01-12], [00-99]
      wdata.forEach(function (x) { var b; return b = formater(x.value[0][0]), mdata[b] || (mdata[b] = [x.value[0][0], 0]), mdata[b][1] += 1 });
      mdata = d3.entries(mdata).sort(function (x, y) { return d3.ascending(x.value[0], y.value[0]) });
      
      formater = d3.time.format("%b"); //月份缩写
      G.selectAll("text.month").data(mdata).enter().append("text")
      .attr("x", function (b) { var d; return d = cell * ext, ext += b.value[1], d })
      .attr("y", -5).attr("class", "month")
      .style("display", function (d) { if (d.value[1] <= 2) return "none" })
      .text(function (d) { return formater(d.value[0]) } );

      G.selectAll("text.day").data(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).enter()
      .append("text").style("display", function (d, i) { if (i % 2 === 0) return "none" })
      .attr("text-anchor", "middle").attr("class", "wday").attr("dx", -10)
      .attr("dy", function (d, i) { return offsetX + ((i - 1) * cell + padding) })
      .text(function (d) { return d[0] });
    }
  })
})