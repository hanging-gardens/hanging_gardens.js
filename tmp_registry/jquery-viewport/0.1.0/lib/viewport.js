var $      = require('jquery')
,   window = require('browser/window')
;

$.fn.viewportState = function(){
  var results = [];
  this.each(function(){
    var bounds = this.getBoundingClientRect();
    if ($(window).height() < bounds.top) {
      results.push(['below', $(this)]);
    } else if (bounds.bottom <= 0) {
      results.push(['above', $(this)]);
    } else {
      results.push(['screen', $(this)]);
    }
  });
  return results;
};

$.fn.inViewport = function(){
  var results = [];
  this.each(function(){
    var bounds = this.getBoundingClientRect();
    if ($(window).height() < bounds.top) {
      // ignore
    } else if (bounds.bottom <= 0) {
      // ignore
    } else {
      results.push(this);
    }
  });
  return $(results);
};

$.fn.aboveViewport = function(){
  var results = [];
  this.each(function(){
    var bounds = this.getBoundingClientRect();
    if ($(window).height() < bounds.top) {
      // ignore
    } else if (bounds.bottom <= 0) {
      results.push(this);
    } else {
      // ignore
    }
  });
  return $(results);
};

$.fn.belowViewport = function(){
  var results = [];
  this.each(function(){
    var bounds = this.getBoundingClientRect();
    if ($(window).height() < bounds.top) {
      results.push(this);
    } else if (bounds.bottom <= 0) {
      // ignore
    } else {
      // ignore
    }
  });
  return $(results);
};
