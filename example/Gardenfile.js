lint({ skip: ['vendor/jquery'] });
yuicompressor();

vendor({
  'jquery': '__GARDEN_MODULE__ ; exports = window.jQuery;'
  });

behaviours(
[ 'index'
, 'hello'
]);