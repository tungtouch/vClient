'use strict';

describe('Service: baseModel', function () {

  // load the service's module
  beforeEach(module('vClientapp'));

  // instantiate service
  var baseModel;
  beforeEach(inject(function (_baseModel_) {
    baseModel = _baseModel_;
  }));

  it('should do something', function () {
    expect(!!baseModel).toBe(true);
  });

});
