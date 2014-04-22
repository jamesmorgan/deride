/*
     Copyright (c) 2014 Andrew Rea
     Copyright (c) 2014 James Allen

     Permission is hereby granted, free of charge, to any person
     obtaining a copy of this software and associated documentation
     files (the "Software"), to deal in the Software without
     restriction, including without limitation the rights to use,
     copy, modify, merge, publish, distribute, sublicense, and/or sell
     copies of the Software, and to permit persons to whom the
     Software is furnished to do so, subject to the following
    conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict';

var deride = require('../lib/deride.js');
var _ = require('lodash');
var util = require('util');
var should = require('should');


var tests = [{
    name: 'Creating a stub object',
    setup: function() {
        return deride.stub(['greet']);
    }
}, {
    name: 'Wrapping existing object using Object Freeze with expectations',
    setup: function() {

        var Person = function(name) {
            return Object.freeze({
                greet: function(otherPersonName) {
                    return util.format('%s says hello to %s', name, otherPersonName);
                }
            });
        };
        return new Person('bob');
    }
}, {
    name: 'wrapping existing objects using prototype style with expectations',
    setup: function() {

        function Person(name) {
            this.name = name;
        }

        Person.prototype.greet = function(another) {
            return 'howdy from ' + this.name + ' to ' + another;
        };

        return new Person('bob proto');
    }
}];

_.forEach(tests, function(test) {
    describe(test.name, function() {
        var bob;

        beforeEach(function(done) {
            bob = test.setup();
            done();
        });

        it('enables counting the number of invocations of a method', function(done) {
            bob = deride.wrap(bob);
            bob.greet('alice');
            bob.expect.greet.called.times(1);
            done();
        });

        it('enables the determination that a method has NEVER been called', function(done) {
            bob = deride.wrap(bob);
            bob.expect.greet.called.never();
            done();
        });

        it('enables the determination of the args used to invoke the method', function(done) {
            bob = deride.wrap(bob);
            bob.greet('alice');
            bob.greet('bob');
            bob.expect.greet.called.withArgs('bob');
            done();
        });

        it('enables overriding a methods body', function(done) {
            bob = deride.wrap(bob);
            bob.setup.greet.toDoThis(function(otherPersonName) {
                return util.format('yo %s', otherPersonName);
            });
            var result = bob.greet('alice');
            result.should.eql('yo alice');
            done();
        });

        it('enables setting the return value of a function', function(done) {
            bob = deride.wrap(bob);
            bob.setup.greet.toReturn('foobar');
            var result = bob.greet('alice');
            result.should.eql('foobar');
            done();
        });

        it('enables throwing an exception for a method invocation', function(done) {
            bob = deride.wrap(bob);
            bob.setup.greet.toThrow('BANG');
            should(function() {
                bob.greet('alice');
            }).
            throw (/BANG/);
            done();
        });

        it('enables overriding a methods body when specific arguments are provided', function(done) {
            bob = deride.wrap(bob);
            bob.setup.greet.when('alice').toDoThis(function(otherPersonName) {
                return util.format('yo yo %s', otherPersonName);
            });
            bob.setup.greet.toDoThis(function(otherPersonName) {
                return util.format('yo %s', otherPersonName);
            });
            var result1 = bob.greet('alice');
            var result2 = bob.greet('bob');
            result1.should.eql('yo yo alice');
            result2.should.eql('yo bob');
            done();
        });

        it('enables setting the return value of a function when specific arguments are provided', function(done) {
            bob = deride.wrap(bob);
            bob.setup.greet.when('alice').toReturn('foobar');
            bob.setup.greet.toReturn('barfoo');
            var result1 = bob.greet('alice');
            var result2 = bob.greet('bob');
            result1.should.eql('foobar');
            result2.should.eql('barfoo');
            done();
        });

        it('enables throwing an exception for a method invocation when specific arguments are provided', function(done) {

            bob = deride.wrap(bob);
            bob.setup.greet.when('alice').toThrow('BANG');
            should(function() {
                bob.greet('alice');
            }).
            throw (/BANG/);
            should(function() {
                bob.greet('bob');
            }).not.
            throw (/BANG/);
            done();
        });
    });
});
