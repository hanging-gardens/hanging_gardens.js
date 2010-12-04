lint({ skip: ['vendor/jquery'] });
// lint();
yuicompressor();

vendor({
  'jquery': '__GARDEN_MODULE__ ; exports = window.jQuery;'
  });

behaviours(
[ 'index'
, 'hello'
, 'bye'
]);