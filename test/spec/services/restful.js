'use strict';

describe('Service: $restful', function () {

  // load the service's module
  beforeEach(module('vClientapp'));

  // instantiate service
  var restful;
  beforeEach(inject(function (_restful_) {
    restful = _restful_;
  }));

  it('should do something', function () {
    expect(!!restful).toBe(true);
  });

});
