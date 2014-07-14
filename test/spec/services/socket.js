'use strict';

describe('Service: socket', function () {

  // load the service's module
  beforeEach(module('vClientapp'));

  // instantiate service
  var socket;
  beforeEach(inject(function (_socket_) {
    socket = _socket_;
  }));

  it('should do something', function () {
    expect(!!socket).toBe(true);
  });

});
